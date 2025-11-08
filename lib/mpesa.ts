import { prisma } from "./prisma";

interface MpesaSettings {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
}

interface STKPushOptions {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

interface MpesaAccessToken {
  access_token: string;
  expires_in: number;
}

// Cache for access token
let cachedToken: MpesaAccessToken | null = null;
let tokenExpiry: number = 0;

/**
 * Get M-Pesa settings from database
 */
async function getMpesaSettings(): Promise<MpesaSettings | null> {
  try {
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: {
        settings: {
          where: {
            key: "mpesa",
          },
        },
      },
    });

    if (!church || !church.settings.length) return null;

    const mpesaSetting = church.settings[0];
    let mpesaData: any;

    // Parse JSON if type is json, otherwise parse the value
    if (mpesaSetting.type === "json") {
      try {
        mpesaData = JSON.parse(mpesaSetting.value);
      } catch {
        return null;
      }
    } else {
      // Try to parse as JSON anyway (for backwards compatibility)
      try {
        mpesaData = JSON.parse(mpesaSetting.value);
      } catch {
        return null;
      }
    }

    if (!mpesaData.consumerKey || !mpesaData.consumerSecret || !mpesaData.shortcode || !mpesaData.passkey) {
      return null;
    }

    return {
      consumerKey: mpesaData.consumerKey,
      consumerSecret: mpesaData.consumerSecret,
      shortcode: mpesaData.shortcode,
      passkey: mpesaData.passkey,
      callbackUrl: mpesaData.callbackUrl || "",
    };
  } catch (error) {
    console.error("Error fetching M-Pesa settings:", error);
    return null;
  }
}

/**
 * Get M-Pesa OAuth access token
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const settings = await getMpesaSettings();
    if (!settings) return null;

    // Check if cached token is still valid
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken.access_token;
    }

    // Get new access token
    const auth = Buffer.from(
      `${settings.consumerKey}:${settings.consumerSecret}`
    ).toString("base64");

    // Determine environment (sandbox or production)
    const isSandbox = settings.shortcode === "174379";
    const baseUrl = isSandbox
      ? "https://sandbox.safaricom.co.ke"
      : "https://api.safaricom.co.ke";

    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to get M-Pesa access token:", await response.text());
      return null;
    }

    const data: MpesaAccessToken = await response.json();
    
    // Cache the token (expires in ~1 hour, cache for 50 minutes)
    cachedToken = data;
    tokenExpiry = Date.now() + (data.expires_in - 600) * 1000;

    return data.access_token;
  } catch (error) {
    console.error("Error getting M-Pesa access token:", error);
    return null;
  }
}

/**
 * Initiate M-Pesa STK Push
 */
export async function initiateSTKPush(
  options: STKPushOptions
): Promise<{
  success: boolean;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  customerMessage?: string;
  error?: string;
}> {
  try {
    const settings = await getMpesaSettings();
    if (!settings) {
      return {
        success: false,
        error: "M-Pesa settings not configured. Please configure M-Pesa in settings.",
      };
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: "Failed to authenticate with M-Pesa API",
      };
    }

    // Format phone number (remove + and ensure 254 format)
    let phoneNumber = options.phoneNumber.replace(/^\+/, "").replace(/\s/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith("254")) {
      phoneNumber = "254" + phoneNumber;
    }

    // Generate timestamp and password
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);
    const password = Buffer.from(
      `${settings.shortcode}${settings.passkey}${timestamp}`
    ).toString("base64");

    // Determine environment
    const isSandbox = settings.shortcode === "174379";
    const baseUrl = isSandbox
      ? "https://sandbox.safaricom.co.ke"
      : "https://api.safaricom.co.ke";

    // STK Push request payload
    const payload = {
      BusinessShortCode: settings.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(options.amount), // Amount in KES
      PartyA: phoneNumber,
      PartyB: settings.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: settings.callbackUrl || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/donations/mpesa-stk`,
      AccountReference: options.accountReference,
      TransactionDesc: options.transactionDesc,
    };

    const response = await fetch(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("M-Pesa STK Push error:", data);
      return {
        success: false,
        error: data.errorMessage || data.error || "Failed to initiate STK Push",
      };
    }

    if (data.ResponseCode === "0") {
      return {
        success: true,
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
        customerMessage: data.CustomerMessage,
      };
    } else {
      return {
        success: false,
        error: data.CustomerMessage || data.errorMessage || "STK Push failed",
      };
    }
  } catch (error: any) {
    console.error("Error initiating M-Pesa STK Push:", error);
    return {
      success: false,
      error: error.message || "Failed to initiate STK Push",
    };
  }
}

/**
 * Query STK Push status
 */
export async function querySTKStatus(
  checkoutRequestID: string
): Promise<{
  success: boolean;
  resultCode?: string;
  resultDesc?: string;
  error?: string;
}> {
  try {
    const settings = await getMpesaSettings();
    if (!settings) {
      return {
        success: false,
        error: "M-Pesa settings not configured",
      };
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: "Failed to authenticate with M-Pesa API",
      };
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);
    const password = Buffer.from(
      `${settings.shortcode}${settings.passkey}${timestamp}`
    ).toString("base64");

    const isSandbox = settings.shortcode === "174379";
    const baseUrl = isSandbox
      ? "https://sandbox.safaricom.co.ke"
      : "https://api.safaricom.co.ke";

    const payload = {
      BusinessShortCode: settings.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    const response = await fetch(
      `${baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.errorMessage || "Failed to query STK status",
      };
    }

    return {
      success: true,
      resultCode: data.ResultCode,
      resultDesc: data.ResultDesc,
    };
  } catch (error: any) {
    console.error("Error querying STK status:", error);
    return {
      success: false,
      error: error.message || "Failed to query STK status",
    };
  }
}

