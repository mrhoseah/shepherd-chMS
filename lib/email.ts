import { prisma } from "./prisma";
import nodemailer from "nodemailer";

interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  content: string;
  html?: string;
}

/**
 * Get email settings from database
 */
async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: {
        settings: {
          where: {
            key: "email",
          },
        },
      },
    });

    if (!church || !church.settings.length) return null;

    const emailSetting = church.settings[0];
    let emailData: any;

    // Parse JSON if type is json, otherwise parse the value
    if (emailSetting.type === "json") {
      try {
        emailData = JSON.parse(emailSetting.value);
      } catch {
        return null;
      }
    } else {
      // Try to parse as JSON anyway (for backwards compatibility)
      try {
        emailData = JSON.parse(emailSetting.value);
      } catch {
        return null;
      }
    }

    if (!emailData.smtpHost || !emailData.smtpPort || !emailData.smtpUser || !emailData.smtpPassword || !emailData.fromEmail) {
      return null;
    }

    return {
      smtpHost: emailData.smtpHost,
      smtpPort: emailData.smtpPort,
      smtpUser: emailData.smtpUser,
      smtpPassword: emailData.smtpPassword,
      fromEmail: emailData.fromEmail,
    };
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return null;
  }
}

/**
 * Create nodemailer transporter
 */
async function createTransporter() {
  const settings = await getEmailSettings();
  if (!settings) {
    throw new Error("Email settings not configured");
  }

  const port = parseInt(settings.smtpPort, 10);
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: port,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    },
    // For Gmail and similar services
    ...(settings.smtpHost.includes("gmail") && {
      service: "gmail",
    }),
  });
}

/**
 * Send email via SMTP
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const settings = await getEmailSettings();
    if (!settings) {
      return {
        success: false,
        error: "Email settings not configured. Please configure SMTP in settings.",
      };
    }

    const transporter = await createTransporter();

    // Convert single recipient to array
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const mailOptions = {
      from: `"${settings.fromEmail.split("@")[0]}" <${settings.fromEmail}>`,
      to: recipients.join(", "),
      subject: options.subject,
      text: options.content,
      html: options.html || options.content.replace(/\n/g, "<br>"),
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmail(
  emails: SendEmailOptions[]
): Promise<{
  success: number;
  failed: number;
  results: Array<{
    to: string | string[];
    success: boolean;
    error?: string;
    messageId?: string;
  }>;
}> {
  const results = await Promise.all(
    emails.map(async (email) => {
      const result = await sendEmail(email);
      return {
        to: email.to,
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

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Email configuration is invalid",
    };
  }
}

