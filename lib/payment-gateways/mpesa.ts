/**
 * M-Pesa Payment Gateway Implementation
 */

import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus } from "./types";
import { initiateSTKPush, querySTKStatus } from "@/lib/mpesa";
import { prisma } from "@/lib/prisma";

export class MpesaGateway implements PaymentGateway {
  name = "M-Pesa";
  method = "MPESA" as const;

  async isAvailable(): Promise<boolean> {
    try {
      const church = await prisma.church.findFirst({
        where: { isActive: true },
        include: {
          settings: {
            where: { key: "mpesa" },
          },
        },
      });

      if (!church || !church.settings.length) return false;

      const setting = church.settings[0];
      const config = setting.type === "json" 
        ? JSON.parse(setting.value) 
        : JSON.parse(setting.value);

      return !!(
        config.consumerKey &&
        config.consumerSecret &&
        config.shortcode &&
        config.passkey
      );
    } catch {
      return false;
    }
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!request.gatewayOptions?.phoneNumber) {
        return {
          success: false,
          status: "failed",
          error: "Phone number is required for M-Pesa payments",
        };
      }

      // Create donation record first
      const donation = await prisma.donation.create({
        data: {
          userId: request.userId || null,
          amount: request.amount,
          category: request.metadata?.category || "OFFERING",
          paymentMethod: "MPESA",
          reference: request.reference,
          status: "pending",
          metadata: {
            ...request.metadata,
            phoneNumber: request.gatewayOptions.phoneNumber,
          },
        },
      });

      // Initiate STK Push
      const stkResult = await initiateSTKPush({
        phoneNumber: request.gatewayOptions.phoneNumber,
        amount: request.amount,
        accountReference: request.reference,
        transactionDesc: request.description || `Donation - ${request.reference}`,
      });

      if (!stkResult.success) {
        // Update donation status to failed
        await prisma.donation.update({
          where: { id: donation.id },
          data: { status: "failed" },
        });

        return {
          success: false,
          status: "failed",
          error: stkResult.error || "Failed to initiate M-Pesa payment",
        };
      }

      // Update donation with M-Pesa request IDs
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          mpesaRequestId: stkResult.checkoutRequestID,
          metadata: {
            ...(donation.metadata as any),
            merchantRequestID: stkResult.merchantRequestID,
            checkoutRequestID: stkResult.checkoutRequestID,
          },
        },
      });

      return {
        success: true,
        transactionId: donation.id,
        gatewayTransactionId: stkResult.checkoutRequestID,
        status: "processing",
        message: stkResult.customerMessage || "STK Push initiated. Please check your phone.",
        metadata: {
          checkoutRequestID: stkResult.checkoutRequestID,
          merchantRequestID: stkResult.merchantRequestID,
        },
      };
    } catch (error: any) {
      console.error("M-Pesa payment error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to process M-Pesa payment",
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const donation = await prisma.donation.findUnique({
        where: { id: transactionId },
      });

      if (!donation) {
        return {
          success: false,
          status: "failed",
          error: "Transaction not found",
        };
      }

      if (!donation.mpesaRequestId) {
        return {
          success: false,
          status: "failed",
          error: "M-Pesa request ID not found",
        };
      }

      // Query STK status
      const statusResult = await querySTKStatus(donation.mpesaRequestId);

      if (!statusResult.success) {
        return {
          success: false,
          status: donation.status as PaymentStatus,
          error: statusResult.error,
        };
      }

      // Update donation status based on result
      let newStatus: PaymentStatus = donation.status as PaymentStatus;
      if (statusResult.resultCode === "0") {
        newStatus = "completed";
        await prisma.donation.update({
          where: { id: transactionId },
          data: { status: "completed" },
        });
      } else if (statusResult.resultCode === "1032") {
        newStatus = "cancelled";
        await prisma.donation.update({
          where: { id: transactionId },
          data: { status: "cancelled" },
        });
      }

      return {
        success: statusResult.resultCode === "0",
        transactionId,
        status: newStatus,
        message: statusResult.resultDesc,
      };
    } catch (error: any) {
      console.error("M-Pesa verification error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to verify M-Pesa payment",
      };
    }
  }

  async handleWebhook(payload: any): Promise<PaymentResponse> {
    try {
      const body = payload.Body?.stkCallback || payload;

      const checkoutRequestID = body.CheckoutRequestID;
      const resultCode = body.ResultCode;
      const resultDesc = body.ResultDesc;

      // Find donation by checkout request ID
      const donation = await prisma.donation.findFirst({
        where: {
          mpesaRequestId: checkoutRequestID,
        },
      });

      if (!donation) {
        return {
          success: false,
          status: "failed",
          error: "Donation not found",
        };
      }

      let status: PaymentStatus = "failed";
      let transactionId: string | undefined;

      if (resultCode === "0") {
        // Payment successful
        const callbackMetadata = body.CallbackMetadata?.Item || [];
        const metadata: Record<string, any> = {};

        callbackMetadata.forEach((item: any) => {
          metadata[item.Name] = item.Value;
        });

        const mpesaReceiptNumber = metadata.MpesaReceiptNumber;
        const transactionDate = metadata.TransactionDate;

        status = "completed";
        transactionId = mpesaReceiptNumber;

        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: "completed",
            transactionId: mpesaReceiptNumber,
            metadata: {
              ...(donation.metadata as any),
              mpesaReceiptNumber,
              transactionDate,
              processedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // Payment failed or cancelled
        status = resultCode === "1032" ? "cancelled" : "failed";
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status,
            metadata: {
              ...(donation.metadata as any),
              errorCode: resultCode,
              errorDescription: resultDesc,
            },
          },
        });
      }

      return {
        success: resultCode === "0",
        transactionId: donation.id,
        gatewayTransactionId: transactionId,
        status,
        message: resultDesc,
      };
    } catch (error: any) {
      console.error("M-Pesa webhook error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to process M-Pesa webhook",
      };
    }
  }

  async refund(transactionId: string, amount?: number): Promise<PaymentResponse> {
    // M-Pesa refunds require B2C API - implement if needed
    return {
      success: false,
      status: "failed",
      error: "M-Pesa refunds not yet implemented",
    };
  }
}

