import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get M-Pesa paybill settings (public, for giving page)
export async function GET(request: NextRequest) {
  try {
    // Get church settings for paybill
    // Assuming single church for now, or get from first church
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: {
        settings: true,
      },
    });

    if (!church) {
      return NextResponse.json({
        paybillNumber: "",
        paybillAccountName: "",
      });
    }

    const paybillNumber = church.settings.find((s) => s.key === "mpesa_paybill_number")?.value || "";
    const paybillAccountName = church.settings.find((s) => s.key === "mpesa_paybill_account_name")?.value || "";

    return NextResponse.json({
      paybillNumber,
      paybillAccountName,
    });
  } catch (error: any) {
    console.error("Error fetching paybill settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch paybill settings" },
      { status: 500 }
    );
  }
}

