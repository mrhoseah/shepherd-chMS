import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

// POST - Generate QR code for giving
export async function POST(request: NextRequest) {
  console.log("=== QR Code Generation API Called ===");
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  
  try {
    console.log("Checking session...");
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "Found" : "Not found");
    
    if (!session) {
      console.log("Returning 401 Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const { amount, category, paymentMethod = "MPESA" } = body;
    
    console.log("QR generation request:", { amount, category, paymentMethod });

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    if (!["MPESA", "PAYPAL"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Payment method must be MPESA or PAYPAL" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // First, try to add the paymentMethod column if it doesn't exist (workaround for schema sync issues)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "GivingQRCode" 
        ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'MPESA'
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "GivingQRCode_paymentMethod_idx" 
        ON "GivingQRCode"("paymentMethod")
      `);
      console.log("paymentMethod column ensured");
    } catch (colError: any) {
      // Column might already exist or there's a permission issue - continue anyway
      console.log("Note: Could not ensure paymentMethod column:", colError.message);
    }

    // Create QR code record WITHOUT paymentMethod first (to avoid Prisma client validation error)
    // Then update it via raw SQL if the column exists
    const qrCode = await prisma.givingQRCode.create({
      data: {
        amount: amount ? parseFloat(amount) : null, // Allow null for "Any Amount"
        category,
        qrCodeData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // 1x1 transparent PNG placeholder
        qrCodeUrl: "", // Will be set below
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
    console.log("QR code created, ID:", qrCode.id);
    
    // Try to update paymentMethod via raw SQL (if column exists)
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "GivingQRCode" SET "paymentMethod" = $1 WHERE id = $2`,
        paymentMethod,
        qrCode.id
      );
      console.log("paymentMethod updated via raw SQL to:", paymentMethod);
    } catch (updateError: any) {
      console.log("Could not update paymentMethod (column may not exist):", updateError.message);
      // Continue anyway - we'll use the default value
    }

    let qrData: string;
    let scanUrl: string;

    if (paymentMethod === "MPESA") {
      // M-Pesa QR code: Contains URL to page where user enters phone number
      qrData = JSON.stringify({
        type: "mpesa_giving",
        qrCodeId: qrCode.id,
        amount: amount ? parseFloat(amount) : null,
        category,
        timestamp: new Date().toISOString(),
      });
      scanUrl = `${baseUrl}/give/qr?data=${encodeURIComponent(qrData)}`;
    } else {
      // PayPal QR code: Contains URL to page where user enters email
      qrData = JSON.stringify({
        type: "paypal_giving",
        qrCodeId: qrCode.id,
        amount: amount ? parseFloat(amount) : null,
        category,
        timestamp: new Date().toISOString(),
      });
      scanUrl = `${baseUrl}/give/paypal?qrCodeId=${qrCode.id}`;
    }

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
      width: 300,
      margin: 2,
    });

    // Update QR code record with generated data
    const updatedQrCode = await prisma.givingQRCode.update({
      where: { id: qrCode.id },
      data: {
        qrCodeData: qrCodeDataUrl,
        qrCodeUrl: qrData, // Store the JSON data for reference
      },
    });

    // Get paymentMethod from the record (might be from raw SQL update)
    let finalPaymentMethod = (updatedQrCode as any).paymentMethod || paymentMethod;
    
    const responseData = {
      qrCode: {
        id: updatedQrCode.id,
        qrCodeData: updatedQrCode.qrCodeData,
        qrCodeUrl: updatedQrCode.qrCodeUrl,
        amount: updatedQrCode.amount,
        category: updatedQrCode.category,
        paymentMethod: finalPaymentMethod,
        expiresAt: updatedQrCode.expiresAt,
        scanUrl,
      },
    };
    
    console.log("QR code generated successfully, returning response");
    console.log("Response data keys:", Object.keys(responseData.qrCode));
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("Error generating QR code:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    
    // Check for specific Prisma errors
    if (error?.code) {
      console.error("Error code:", error.code);
    }
    if (error?.meta) {
      console.error("Error meta:", error.meta);
    }
    
    return NextResponse.json(
      { 
        error: error?.message || error?.toString() || "Failed to generate QR code",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
        code: error?.code,
        meta: process.env.NODE_ENV === "development" ? error?.meta : undefined,
      },
      { status: 500 }
    );
  }
}

