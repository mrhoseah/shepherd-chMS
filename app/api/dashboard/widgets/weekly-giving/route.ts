import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/casbin";

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

    const [weekly, lastWeek] = await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          status: "completed",
        },
      }),
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          status: "completed",
        },
      }),
    ]);

    const weeklyAmount = Number(weekly._sum.amount || 0);
    const lastWeekAmount = Number(lastWeek._sum.amount || 0);

    return NextResponse.json({
      weekly: weeklyAmount,
      lastWeek: lastWeekAmount,
      change: lastWeekAmount > 0 
        ? ((weeklyAmount - lastWeekAmount) / lastWeekAmount) * 100 
        : 0,
    });
  } catch (error: any) {
    console.error("Error fetching weekly giving:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

