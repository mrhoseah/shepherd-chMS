import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Public QR code scan (no authentication required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCodeId, qrData } = body;

    if (!qrCodeId && !qrData) {
      return NextResponse.json(
        { error: "QR code ID or data is required" },
        { status: 400 }
      );
    }

    // If qrData is provided, parse it to get the QR code ID
    let qrCode;
    if (qrData) {
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.qrCodeId) {
          qrCode = await prisma.givingQRCode.findUnique({
            where: { id: parsed.qrCodeId },
            include: {
              donation: true,
            },
          });
        }
      } catch (e) {
        // If parsing fails, try to find by qrCodeUrl
        qrCode = await prisma.givingQRCode.findFirst({
          where: { qrCodeUrl: qrData },
          include: {
            donation: true,
          },
        });
      }
    } else if (qrCodeId) {
      qrCode = await prisma.givingQRCode.findUnique({
        where: { id: qrCodeId },
        include: {
          donation: true,
        },
      });
    }

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      );
    }

    // Check if QR code has expired
    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "QR code has expired" },
        { status: 400 }
      );
    }

    // Check if QR code has already been used
    if (qrCode.isUsed) {
      return NextResponse.json(
        {
          error: "QR code has already been used",
          donation: qrCode.donation,
        },
        { status: 400 }
      );
    }

    // Return QR code details
    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        amount: qrCode.amount,
        category: qrCode.category,
        paymentMethod: qrCode.paymentMethod || "MPESA",
        expiresAt: qrCode.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Error scanning QR code:", error);
    return NextResponse.json(
      { error: "Failed to scan QR code" },
      { status: 500 }
    );
  }
}

