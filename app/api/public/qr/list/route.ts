import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Public endpoint to list available QR codes (no authentication required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const paymentMethod = searchParams.get("paymentMethod");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause (don't include paymentMethod in where clause as it might not exist)
    const where: any = {
      isUsed: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (category && category !== "all") {
      where.category = category;
    }

    // Fetch available QR codes (without paymentMethod in select to avoid errors)
    let qrCodes: any[];
    try {
      qrCodes = await prisma.givingQRCode.findMany({
        where,
        select: {
          id: true,
          amount: true,
          category: true,
          qrCodeData: true,
          qrCodeUrl: true,
          expiresAt: true,
        },
        orderBy: [
          { amount: "asc" },
          { createdAt: "desc" },
        ],
        take: limit,
      });

      // Try to get paymentMethod using raw SQL if column exists
      const paymentMethodMap = new Map<string, string>();
      if (qrCodes.length > 0) {
        try {
          const ids = qrCodes.map(q => q.id);
          const rawResults = await prisma.$queryRaw<Array<{ id: string; paymentMethod: string | null }>>`
            SELECT id, "paymentMethod"
            FROM "GivingQRCode"
            WHERE id = ANY(${ids}::text[])
          `;
          
          rawResults.forEach((row) => {
            if (row.paymentMethod) {
              paymentMethodMap.set(row.id, row.paymentMethod);
            }
          });
        } catch (rawError: any) {
          // paymentMethod column doesn't exist, that's okay - we'll use default
          console.log("paymentMethod column not found, using default MPESA:", rawError?.message || rawError);
        }
      }

      // Add paymentMethod to each QR code (default to MPESA if not found)
      qrCodes = qrCodes.map((q: any) => ({
        ...q,
        paymentMethod: paymentMethodMap.get(q.id) || "MPESA",
      }));

      // Filter by paymentMethod in JavaScript if needed
      if (paymentMethod && paymentMethod !== "all") {
        qrCodes = qrCodes.filter((q: any) => q.paymentMethod === paymentMethod);
      }
    } catch (error: any) {
      console.error("Error fetching QR codes from database:", error);
      // Return empty array instead of throwing to prevent UI errors
      return NextResponse.json({
        success: true,
        qrCodes: [],
        count: 0,
        error: error.message,
      });
    }

    // Generate scan URLs for each QR code
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const qrCodesWithUrls = qrCodes.map((qrCode) => {
      const paymentMethod = (qrCode as any).paymentMethod || "MPESA";
      let scanUrl: string;

      if (paymentMethod === "PAYPAL") {
        scanUrl = `${baseUrl}/give/paypal?qrCodeId=${qrCode.id}`;
      } else {
        // M-Pesa: use the stored qrCodeUrl or generate from QR code data
        const qrData = qrCode.qrCodeUrl || JSON.stringify({
          type: "mpesa_giving",
          qrCodeId: qrCode.id,
          amount: qrCode.amount,
          category: qrCode.category,
        });
        scanUrl = `${baseUrl}/give/qr?data=${encodeURIComponent(qrData)}`;
      }

      return {
        ...qrCode,
        paymentMethod,
        scanUrl,
      };
    });

    return NextResponse.json({
      success: true,
      qrCodes: qrCodesWithUrls,
      count: qrCodesWithUrls.length,
    });
  } catch (error: any) {
    console.error("Error fetching QR codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch QR codes" },
      { status: 500 }
    );
  }
}

