import { prisma } from "./prisma";

interface SMSSettings {
  apiKey: string;
  username: string;
  senderId: string;
}

interface SendSMSOptions {
  to: string;
  message: string;
}

/**
 * Get SMS settings from database
 */
async function getSMSSettings(): Promise<SMSSettings | null> {
  try {
    // Get the first active church
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: {
        settings: {
          where: {
            key: "sms",
          },
        },
      },
    });

    if (!church || !church.settings.length) return null;

    const smsSetting = church.settings[0];
    let smsData: any;

    // Parse JSON if type is json, otherwise parse the value
    if (smsSetting.type === "json") {
      try {
        smsData = JSON.parse(smsSetting.value);
      } catch {
        return null;
      }
    } else {
      // Try to parse as JSON anyway (for backwards compatibility)
      try {
        smsData = JSON.parse(smsSetting.value);
      } catch {
        return null;
      }
    }

    if (!smsData.apiKey || !smsData.username || !smsData.senderId) {
      return null;
    }

    return {
      apiKey: smsData.apiKey,
      username: smsData.username,
      senderId: smsData.senderId,
    };
  } catch (error) {
    console.error("Error fetching SMS settings:", error);
    return null;
  }
}

/**
 * Send SMS via Afrika's Talking API
 */
export async function sendSMS(options: SendSMSOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const settings = await getSMSSettings();

    if (!settings) {
      return {
        success: false,
        error: "SMS settings not configured. Please configure Afrika's Talking in settings.",
      };
    }

    // Format phone number (remove + and ensure proper format)
    let phoneNumber = options.to.replace(/^\+/, "").replace(/\s/g, "");
    
    // If number starts with 0, replace with country code (254 for Kenya)
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.substring(1);
    }
    
    // If number doesn't start with country code, assume Kenya (254)
    if (!phoneNumber.startsWith("254")) {
      phoneNumber = "254" + phoneNumber;
    }

    // Afrika's Talking SMS API endpoint
    const url = "https://api.africastalking.com/version1/messaging";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": settings.apiKey,
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        username: settings.username,
        to: phoneNumber,
        message: options.message,
        from: settings.senderId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Afrika's Talking API error:", data);
      return {
        success: false,
        error: data.errorMessage || data.message || "Failed to send SMS",
      };
    }

    // Afrika's Talking returns data in format:
    // { SMSMessageData: { Message: "...", Recipients: [...] } }
    if (data.SMSMessageData?.Recipients?.[0]) {
      const recipient = data.SMSMessageData.Recipients[0];
      return {
        success: recipient.status === "Success",
        messageId: recipient.messageId,
        error: recipient.status !== "Success" ? recipient.status : undefined,
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
    };
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(
  messages: SendSMSOptions[]
): Promise<{
  success: number;
  failed: number;
  results: Array<{
    to: string;
    success: boolean;
    error?: string;
    messageId?: string;
  }>;
}> {
  const results = await Promise.all(
    messages.map(async (msg) => {
      const result = await sendSMS(msg);
      return {
        to: msg.to,
        success: result.success,
        error: result.error,
        messageId: result.messageId,
      };
    })
  );

  const success = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    success,
    failed,
    results,
  };
}

