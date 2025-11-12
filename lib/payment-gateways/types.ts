/**
 * Unified Payment Gateway Types
 */

export type PaymentMethod = "MPESA" | "PAYPAL" | "STRIPE" | "BANK_TRANSFER" | "CASH" | "CHECK";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "cancelled" | "refunded";

export interface PaymentRequest {
  amount: number;
  currency?: string;
  description?: string;
  reference: string;
  userId?: string;
  metadata?: Record<string, any>;
  // Gateway-specific options
  gatewayOptions?: {
    phoneNumber?: string; // For M-Pesa
    email?: string; // For PayPal/Stripe
    returnUrl?: string; // For PayPal/Stripe
    cancelUrl?: string; // For PayPal/Stripe
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  gatewayTransactionId?: string;
  status: PaymentStatus;
  message?: string;
  redirectUrl?: string; // For redirect-based payments (PayPal, Stripe)
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaymentGateway {
  name: string;
  method: PaymentMethod;
  isAvailable(): Promise<boolean>;
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<PaymentResponse>;
  handleWebhook(payload: any): Promise<PaymentResponse>;
  refund(transactionId: string, amount?: number): Promise<PaymentResponse>;
}

export interface GatewayConfig {
  enabled: boolean;
  credentials: Record<string, string>;
  webhookUrl?: string;
  testMode?: boolean;
}

