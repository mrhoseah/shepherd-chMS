/**
 * PayPal Payment Gateway Implementation
 */

import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus } from "./types";
import { prisma } from "@/lib/prisma";

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "live";
  webhookId?: string;
}

export class PayPalGateway implements PaymentGateway {
  name = "PayPal";
  method = "PAYPAL" as const;

  private async getConfig(): Promise<PayPalConfig | null> {
    try {
      const church = await prisma.church.findFirst({
        where: { isActive: true },
        include: {
          settings: {
            where: { key: "paypal" },
          },
        },
      });

      if (!church || !church.settings.length) return null;

      const setting = church.settings[0];
      const config = setting.type === "json" 
        ? JSON.parse(setting.value) 
        : JSON.parse(setting.value);

      return {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        mode: config.mode || "sandbox",
        webhookId: config.webhookId,
      };
    } catch {
      return null;
    }
  }

  private async getAccessToken(config: PayPalConfig): Promise<string | null> {
    try {
      const baseUrl = config.mode === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

      const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.access_token;
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(config?.clientId && config?.clientSecret);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const config = await this.getConfig();
      if (!config) {
        return {
          success: false,
          status: "failed",
          error: "PayPal not configured",
        };
      }

      const accessToken = await this.getAccessToken(config);
      if (!accessToken) {
        return {
          success: false,
          status: "failed",
          error: "Failed to authenticate with PayPal",
        };
      }

      const baseUrl = config.mode === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

      // Create donation record
      const donation = await prisma.donation.create({
        data: {
          userId: request.userId || null,
          amount: request.amount,
          category: request.metadata?.category || "OFFERING",
          paymentMethod: "PAYPAL",
          reference: request.reference,
          status: "pending",
          metadata: request.metadata,
        },
      });

      // Create PayPal order
      const orderPayload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: request.reference,
            custom_id: donation.id,
            description: request.description || `Donation - ${request.reference}`,
            amount: {
              currency_code: request.currency || "USD",
              value: request.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Eastgate Chapel",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
          return_url: request.gatewayOptions?.returnUrl || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/give/paypal/return`,
          cancel_url: request.gatewayOptions?.cancelUrl || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/give/paypal/cancel`,
        },
      };

      const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        await prisma.donation.update({
          where: { id: donation.id },
          data: { status: "failed" },
        });

        const error = await response.json();
        return {
          success: false,
          status: "failed",
          error: error.message || "Failed to create PayPal order",
        };
      }

      const order = await response.json();
      const approvalUrl = order.links?.find((link: any) => link.rel === "approve")?.href;

      // Update donation with PayPal order ID
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          paypalOrderId: order.id,
          metadata: {
            ...(donation.metadata as any),
            paypalOrderId: order.id,
          },
        },
      });

      return {
        success: true,
        transactionId: donation.id,
        gatewayTransactionId: order.id,
        status: "processing",
        redirectUrl: approvalUrl,
        message: "Redirect to PayPal to complete payment",
      };
    } catch (error: any) {
      console.error("PayPal payment error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to process PayPal payment",
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const donation = await prisma.donation.findUnique({
        where: { id: transactionId },
      });

      if (!donation || !donation.paypalOrderId) {
        return {
          success: false,
          status: "failed",
          error: "Transaction not found",
        };
      }

      const config = await this.getConfig();
      if (!config) {
        return {
          success: false,
          status: "failed",
          error: "PayPal not configured",
        };
      }

      const accessToken = await this.getAccessToken(config);
      if (!accessToken) {
        return {
          success: false,
          status: "failed",
          error: "Failed to authenticate with PayPal",
        };
      }

      const baseUrl = config.mode === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

      const response = await fetch(`${baseUrl}/v2/checkout/orders/${donation.paypalOrderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          status: donation.status as PaymentStatus,
          error: "Failed to verify PayPal order",
        };
      }

      const order = await response.json();
      const status = order.status;

      let newStatus: PaymentStatus = donation.status as PaymentStatus;
      if (status === "COMPLETED") {
        newStatus = "completed";
        await prisma.donation.update({
          where: { id: transactionId },
          data: { status: "completed" },
        });
      } else if (status === "CANCELLED" || status === "VOIDED") {
        newStatus = "cancelled";
        await prisma.donation.update({
          where: { id: transactionId },
          data: { status: "cancelled" },
        });
      }

      return {
        success: status === "COMPLETED",
        transactionId,
        gatewayTransactionId: order.id,
        status: newStatus,
        message: order.status,
      };
    } catch (error: any) {
      console.error("PayPal verification error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to verify PayPal payment",
      };
    }
  }

  async handleWebhook(payload: any): Promise<PaymentResponse> {
    try {
      const eventType = payload.event_type;
      const resource = payload.resource;

      if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
        const transactionId = resource.id;
        const customId = resource.custom_id; // This is our donation ID
        const orderId = resource.supplementary_data?.related_ids?.order_id;

        const donation = await prisma.donation.findFirst({
          where: {
            OR: [
              { id: customId },
              { paypalOrderId: orderId },
              { paypalTransactionId: transactionId },
            ],
          },
        });

        if (!donation) {
          return {
            success: false,
            status: "failed",
            error: "Donation not found",
          };
        }

        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: "completed",
            paypalTransactionId: transactionId,
            paypalOrderId: orderId,
            metadata: {
              ...(donation.metadata as any),
              payerEmail: resource.payer?.email_address,
              currency: resource.amount?.currency_code,
              completedAt: new Date().toISOString(),
            },
          },
        });

        return {
          success: true,
          transactionId: donation.id,
          gatewayTransactionId: transactionId,
          status: "completed",
          message: "Payment completed",
        };
      }

      return {
        success: false,
        status: "failed",
        error: "Unhandled webhook event",
      };
    } catch (error: any) {
      console.error("PayPal webhook error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to process PayPal webhook",
      };
    }
  }

  async refund(transactionId: string, amount?: number): Promise<PaymentResponse> {
    // Implement PayPal refund
    return {
      success: false,
      status: "failed",
      error: "PayPal refunds not yet implemented",
    };
  }
}

