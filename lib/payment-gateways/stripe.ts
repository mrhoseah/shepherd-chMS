/**
 * Stripe Payment Gateway Implementation
 */

import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus } from "./types";
import { prisma } from "@/lib/prisma";

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
  mode: "test" | "live";
}

export class StripeGateway implements PaymentGateway {
  name = "Stripe";
  method = "STRIPE" as const;

  private async getConfig(): Promise<StripeConfig | null> {
    try {
      const church = await prisma.church.findFirst({
        where: { isActive: true },
        include: {
          settings: {
            where: { key: "stripe" },
          },
        },
      });

      if (!church || !church.settings.length) return null;

      const setting = church.settings[0];
      const config = setting.type === "json" 
        ? JSON.parse(setting.value) 
        : JSON.parse(setting.value);

      return {
        publishableKey: config.publishableKey,
        secretKey: config.secretKey,
        webhookSecret: config.webhookSecret,
        mode: config.mode || "test",
      };
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(config?.publishableKey && config?.secretKey);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const config = await this.getConfig();
      if (!config) {
        return {
          success: false,
          status: "failed",
          error: "Stripe not configured",
        };
      }

      // Create donation record
      const donation = await prisma.donation.create({
        data: {
          userId: request.userId || null,
          amount: request.amount,
          category: request.metadata?.category || "OFFERING",
          paymentMethod: "STRIPE",
          reference: request.reference,
          status: "pending",
          metadata: {
            ...request.metadata,
            currency: request.currency || "USD",
          },
        },
      });

      // Create Stripe Payment Intent
      const stripe = require("stripe")(config.secretKey);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency?.toLowerCase() || "usd",
        description: request.description || `Donation - ${request.reference}`,
        metadata: {
          donationId: donation.id,
          reference: request.reference,
          userId: request.userId || "",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update donation with Stripe payment intent ID
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          transactionId: paymentIntent.id,
          metadata: {
            ...(donation.metadata as any),
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
          },
        },
      });

      return {
        success: true,
        transactionId: donation.id,
        gatewayTransactionId: paymentIntent.id,
        status: "processing",
        message: "Payment intent created",
        metadata: {
          clientSecret: paymentIntent.client_secret,
          publishableKey: config.publishableKey,
        },
      };
    } catch (error: any) {
      console.error("Stripe payment error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to process Stripe payment",
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const donation = await prisma.donation.findUnique({
        where: { id: transactionId },
      });

      if (!donation || !donation.transactionId) {
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
          error: "Stripe not configured",
        };
      }

      const stripe = require("stripe")(config.secretKey);

      const paymentIntent = await stripe.paymentIntents.retrieve(donation.transactionId);

      let newStatus: PaymentStatus = donation.status as PaymentStatus;
      if (paymentIntent.status === "succeeded") {
        newStatus = "completed";
        await prisma.donation.update({
          where: { id: transactionId },
          data: { status: "completed" },
        });
      } else if (paymentIntent.status === "canceled") {
        newStatus = "cancelled";
        await prisma.donation.update({
          where: { id: transactionId },
          data: { status: "cancelled" },
        });
      }

      return {
        success: paymentIntent.status === "succeeded",
        transactionId,
        gatewayTransactionId: paymentIntent.id,
        status: newStatus,
        message: paymentIntent.status,
      };
    } catch (error: any) {
      console.error("Stripe verification error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to verify Stripe payment",
      };
    }
  }

  async handleWebhook(payload: any): Promise<PaymentResponse> {
    try {
      const config = await this.getConfig();
      if (!config || !config.webhookSecret) {
        return {
          success: false,
          status: "failed",
          error: "Stripe webhook secret not configured",
        };
      }

      const stripe = require("stripe")(config.secretKey);
      const sig = payload.headers?.["stripe-signature"];

      let event;
      try {
        event = stripe.webhooks.constructEvent(payload.body, sig, config.webhookSecret);
      } catch (err: any) {
        return {
          success: false,
          status: "failed",
          error: `Webhook signature verification failed: ${err.message}`,
        };
      }

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const donationId = paymentIntent.metadata?.donationId;

        if (!donationId) {
          return {
            success: false,
            status: "failed",
            error: "Donation ID not found in metadata",
          };
        }

        const donation = await prisma.donation.findUnique({
          where: { id: donationId },
        });

        if (!donation) {
          return {
            success: false,
            status: "failed",
            error: "Donation not found",
          };
        }

        await prisma.donation.update({
          where: { id: donationId },
          data: {
            status: "completed",
            transactionId: paymentIntent.id,
            metadata: {
              ...(donation.metadata as any),
              completedAt: new Date().toISOString(),
              paymentMethod: paymentIntent.payment_method_types?.[0],
            },
          },
        });

        return {
          success: true,
          transactionId: donationId,
          gatewayTransactionId: paymentIntent.id,
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
      console.error("Stripe webhook error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to process Stripe webhook",
      };
    }
  }

  async refund(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const donation = await prisma.donation.findUnique({
        where: { id: transactionId },
      });

      if (!donation || !donation.transactionId) {
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
          error: "Stripe not configured",
        };
      }

      const stripe = require("stripe")(config.secretKey);

      const refundAmount = amount ? Math.round(amount * 100) : undefined;

      const refund = await stripe.refunds.create({
        payment_intent: donation.transactionId,
        amount: refundAmount,
      });

      await prisma.donation.update({
        where: { id: transactionId },
        data: {
          status: "refunded",
          metadata: {
            ...(donation.metadata as any),
            refundId: refund.id,
            refundedAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        transactionId,
        gatewayTransactionId: refund.id,
        status: "refunded",
        message: "Refund processed",
      };
    } catch (error: any) {
      console.error("Stripe refund error:", error);
      return {
        success: false,
        status: "failed",
        error: error.message || "Failed to process refund",
      };
    }
  }
}

