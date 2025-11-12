/**
 * Unified Payment Gateway Manager
 */

import { PaymentGateway, PaymentMethod, PaymentRequest, PaymentResponse } from "./types";
import { MpesaGateway } from "./mpesa";
import { PayPalGateway } from "./paypal";
import { StripeGateway } from "./stripe";

class PaymentGatewayManager {
  private gateways: Map<PaymentMethod, PaymentGateway> = new Map();

  constructor() {
    // Register all available gateways
    this.gateways.set("MPESA", new MpesaGateway());
    this.gateways.set("PAYPAL", new PayPalGateway());
    this.gateways.set("STRIPE", new StripeGateway());
  }

  /**
   * Get gateway instance for a payment method
   */
  getGateway(method: PaymentMethod): PaymentGateway | null {
    return this.gateways.get(method) || null;
  }

  /**
   * Get all available gateways
   */
  async getAvailableGateways(): Promise<PaymentMethod[]> {
    const available: PaymentMethod[] = [];
    
    for (const [method, gateway] of this.gateways.entries()) {
      if (await gateway.isAvailable()) {
        available.push(method);
      }
    }

    return available;
  }

  /**
   * Process payment using the appropriate gateway
   */
  async processPayment(
    method: PaymentMethod,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    const gateway = this.getGateway(method);
    
    if (!gateway) {
      return {
        success: false,
        status: "failed",
        error: `Payment gateway ${method} not available`,
      };
    }

    if (!(await gateway.isAvailable())) {
      return {
        success: false,
        status: "failed",
        error: `Payment gateway ${method} is not configured`,
      };
    }

    return gateway.processPayment(request);
  }

  /**
   * Verify payment status
   */
  async verifyPayment(
    method: PaymentMethod,
    transactionId: string
  ): Promise<PaymentResponse> {
    const gateway = this.getGateway(method);
    
    if (!gateway) {
      return {
        success: false,
        status: "failed",
        error: `Payment gateway ${method} not available`,
      };
    }

    return gateway.verifyPayment(transactionId);
  }

  /**
   * Handle webhook from payment gateway
   */
  async handleWebhook(
    method: PaymentMethod,
    payload: any
  ): Promise<PaymentResponse> {
    const gateway = this.getGateway(method);
    
    if (!gateway) {
      return {
        success: false,
        status: "failed",
        error: `Payment gateway ${method} not available`,
      };
    }

    return gateway.handleWebhook(payload);
  }

  /**
   * Process refund
   */
  async refund(
    method: PaymentMethod,
    transactionId: string,
    amount?: number
  ): Promise<PaymentResponse> {
    const gateway = this.getGateway(method);
    
    if (!gateway) {
      return {
        success: false,
        status: "failed",
        error: `Payment gateway ${method} not available`,
      };
    }

    return gateway.refund(transactionId, amount);
  }
}

// Export singleton instance
export const paymentGatewayManager = new PaymentGatewayManager();

// Export types and gateways
export * from "./types";
export { MpesaGateway } from "./mpesa";
export { PayPalGateway } from "./paypal";
export { StripeGateway } from "./stripe";

