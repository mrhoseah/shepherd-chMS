import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

/**
 * Generate QR codes for an attendance session
 * Creates QR codes for both M-Pesa and PayPal (if enabled)
 */
export async function generateSessionQRCodes(
  sessionId: string,
  options?: {
    amount?: number | null;
    category?: string;
    paymentMethods?: ("MPESA" | "PAYPAL")[];
    expiresInHours?: number;
  }
) {
  const {
    amount = null, // null = any amount
    category = "OFFERING",
    paymentMethods = ["MPESA", "PAYPAL"],
    expiresInHours = 24,
  } = options || {};

  // Get session details
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      masterEvent: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Attendance session not found");
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  // Ensure paymentMethod column exists
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "GivingQRCode" 
      ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'MPESA'
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "GivingQRCode" 
      ADD COLUMN IF NOT EXISTS "sessionId" TEXT
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "GivingQRCode_sessionId_idx" 
      ON "GivingQRCode"("sessionId")
    `);
  } catch (colError: any) {
    // Columns might already exist - continue
    console.log("Note: Could not ensure columns:", colError.message);
  }

  const generatedQRCodes = [];

  // Generate QR code for each payment method
  for (const paymentMethod of paymentMethods) {
    try {
      // Create QR code record (without sessionId initially to avoid Prisma validation errors)
      const qrCode = await prisma.givingQRCode.create({
        data: {
          amount: amount ? parseFloat(amount.toString()) : null,
          category: category as any,
          qrCodeData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // Placeholder
          qrCodeUrl: "",
          expiresAt,
          // Don't include sessionId here - update via raw SQL to avoid schema sync issues
        },
      });

      // Update paymentMethod and sessionId via raw SQL (workaround for schema sync issues)
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "GivingQRCode" SET "paymentMethod" = $1, "sessionId" = $2 WHERE id = $3`,
          paymentMethod,
          sessionId,
          qrCode.id
        );
      } catch (updateError: any) {
        console.log("Could not update paymentMethod/sessionId:", updateError.message);
        // Try updating just paymentMethod if sessionId column doesn't exist
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE "GivingQRCode" SET "paymentMethod" = $1 WHERE id = $2`,
            paymentMethod,
            qrCode.id
          );
        } catch (pmError: any) {
          console.log("Could not update paymentMethod:", pmError.message);
        }
      }

      // Generate scan URL
      let scanUrl: string;
      if (paymentMethod === "PAYPAL") {
        scanUrl = `${baseUrl}/give/paypal?qrCodeId=${qrCode.id}&sessionId=${sessionId}`;
      } else {
        // M-Pesa
        const qrData = JSON.stringify({
          type: "mpesa_giving",
          qrCodeId: qrCode.id,
          sessionId: sessionId,
          amount: amount,
          category: category,
        });
        scanUrl = `${baseUrl}/give/qr?data=${encodeURIComponent(qrData)}`;
      }

      // Generate QR code image
      const qrCodeData = await QRCode.toDataURL(scanUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Update QR code with generated data
      await prisma.givingQRCode.update({
        where: { id: qrCode.id },
        data: {
          qrCodeData,
          qrCodeUrl: scanUrl,
        },
      });

      generatedQRCodes.push({
        id: qrCode.id,
        paymentMethod,
        qrCodeData,
        scanUrl,
        amount,
        category,
      });
    } catch (error: any) {
      console.error(`Error generating QR code for ${paymentMethod}:`, error);
      // Continue with other payment methods
    }
  }

  return {
    success: true,
    sessionId,
    sessionName: session.masterEvent.name,
    qrCodes: generatedQRCodes,
  };
}

