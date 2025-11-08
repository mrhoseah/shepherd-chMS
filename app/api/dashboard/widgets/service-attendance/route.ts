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
      "attendance",
      "view"
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [thisWeek, fourWeek] = await Promise.all([
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          type: "service",
        },
      }),
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          type: "service",
        },
      }),
    ]);

    const fourWeekAverage = fourWeek / 4;
    const change = fourWeekAverage > 0
      ? ((thisWeek - fourWeekAverage) / fourWeekAverage) * 100
      : 0;

    return NextResponse.json({
      thisWeek,
      fourWeekAverage,
      change,
    });
  } catch (error: any) {
    console.error("Error fetching service attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

