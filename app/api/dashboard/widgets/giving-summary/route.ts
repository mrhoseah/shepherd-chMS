import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/casbin";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      "donations",
      "view"
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const [monthly, yearly, donations] = await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          status: "completed",
        },
      }),
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: yearStart,
            lte: yearEnd,
          },
          status: "completed",
        },
      }),
      prisma.donation.findMany({
        where: {
          status: "completed",
        },
        select: {
          amount: true,
        },
      }),
    ]);

    const monthlyAmount = Number(monthly._sum.amount || 0);
    const yearlyAmount = Number(yearly._sum.amount || 0);
    const totalDonations = donations.length;
    const averageGift = totalDonations > 0
      ? donations.reduce((sum, d) => sum + Number(d.amount), 0) / totalDonations
      : 0;

    return NextResponse.json({
      monthly: monthlyAmount,
      yearly: yearlyAmount,
      averageGift,
    });
  } catch (error: any) {
    console.error("Error fetching giving summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

