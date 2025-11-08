import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

// POST - Generate QR code for giving
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, category } = body;

    if (!amount || !category) {
      return NextResponse.json(
        { error: "Amount and category are required" },
        { status: 400 }
      );
    }

    // Create QR code record first to get the ID
    const qrCode = await prisma.givingQRCode.create({
      data: {
        amount: parseFloat(amount),
        category,
        qrCodeUrl: "", // Will be set below
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Create QR code data (will trigger M-Pesa STK push when scanned)
    const qrData = JSON.stringify({
      type: "mpesa_giving",
      qrCodeId: qrCode.id,
      amount: parseFloat(amount),
      category,
      timestamp: new Date().toISOString(),
    });

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
    });

    // Update QR code record with generated data
    const updatedQrCode = await prisma.givingQRCode.update({
      where: { id: qrCode.id },
      data: {
        qrCodeData: qrCodeDataUrl,
        qrCodeUrl: qrData, // For mobile scanning
      },
    });

    return NextResponse.json({
      qrCode: {
        id: updatedQrCode.id,
        qrCodeData: updatedQrCode.qrCodeData,
        qrCodeUrl: updatedQrCode.qrCodeUrl,
        amount: updatedQrCode.amount,
        category: updatedQrCode.category,
        expiresAt: updatedQrCode.expiresAt,
        scanUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/give/qr?data=${encodeURIComponent(qrData)}`,
      },
    });
  } catch (error: any) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}

