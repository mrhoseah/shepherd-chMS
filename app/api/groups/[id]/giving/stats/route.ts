import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get giving statistics for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all completed donations for this group
    const donations = await prisma.donation.findMany({
      where: {
        groupId: id,
        status: "completed",
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalDonations = donations.length;

    // This month's donations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthDonations = donations.filter(
      (d) => new Date(d.createdAt) >= startOfMonth
    );
    const thisMonth = thisMonthDonations.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    );

    return NextResponse.json({
      totalAmount,
      totalDonations,
      thisMonth,
    });
  } catch (error: any) {
    console.error("Error fetching group giving stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch giving statistics" },
      { status: 500 }
    );
  }
}

