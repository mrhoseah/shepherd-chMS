import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, eachWeekOfInterval, format } from "date-fns";

// GET - Get attendance report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "month";

    let dateFilter: { gte: Date; lte: Date } | undefined;

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      const now = new Date();
      switch (period) {
        case "month":
          dateFilter = {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          };
          break;
        case "quarter":
          dateFilter = {
            gte: startOfMonth(subMonths(now, 2)),
            lte: endOfMonth(now),
          };
          break;
        case "year":
          dateFilter = {
            gte: startOfYear(now),
            lte: endOfYear(now),
          };
          break;
      }
    }

    const attendances = await prisma.attendance.findMany({
      where: dateFilter
        ? {
            date: {
              gte: dateFilter.gte,
              lte: dateFilter.lte,
            },
          }
        : undefined,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            campus: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const totalAttendance = attendances.length;
    const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
    const absentCount = attendances.filter((a) => a.status === "ABSENT").length;

    // Daily breakdown
    const dailyBreakdown = attendances.reduce((acc, att) => {
      const date = format(new Date(att.date), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0, total: 0 };
      }
      if (att.status === "PRESENT") {
        acc[date].present++;
      } else if (att.status === "ABSENT") {
        acc[date].absent++;
      }
      acc[date].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

    // Weekly breakdown
    const weeklyBreakdown = dateFilter
      ? eachWeekOfInterval(
          { start: dateFilter.gte, end: dateFilter.lte },
          { weekStartsOn: 0 }
        ).map((weekStart) => {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekAttendances = attendances.filter(
            (a) =>
              new Date(a.date) >= weekStart && new Date(a.date) <= weekEnd
          );
          return {
            week: format(weekStart, "MMM dd"),
            present: weekAttendances.filter((a) => a.status === "PRESENT").length,
            absent: weekAttendances.filter((a) => a.status === "ABSENT").length,
            total: weekAttendances.length,
          };
        })
      : [];

    // By role
    const byRole = attendances.reduce((acc, att) => {
      const role = att.user?.role || "UNKNOWN";
      if (!acc[role]) {
        acc[role] = { present: 0, absent: 0, total: 0 };
      }
      if (att.status === "PRESENT") {
        acc[role].present++;
      } else if (att.status === "ABSENT") {
        acc[role].absent++;
      }
      acc[role].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

    // By campus
    const byCampus = attendances.reduce((acc, att) => {
      const campus = att.user?.campus?.name || "No Campus";
      if (!acc[campus]) {
        acc[campus] = { present: 0, absent: 0, total: 0 };
      }
      if (att.status === "PRESENT") {
        acc[campus].present++;
      } else if (att.status === "ABSENT") {
        acc[campus].absent++;
      }
      acc[campus].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

    // Top attendees
    const topAttendees = attendances
      .filter((a) => a.user)
      .reduce((acc, att) => {
        const userId = att.user!.id;
        if (!acc[userId]) {
          acc[userId] = {
            user: att.user!,
            present: 0,
            total: 0,
          };
        }
        if (att.status === "PRESENT") {
          acc[userId].present++;
        }
        acc[userId].total++;
        return acc;
      }, {} as Record<string, { user: any; present: number; total: number }>);

    return NextResponse.json({
      reportType: "attendance",
      period: dateFilter,
      summary: {
        totalAttendance,
        present: presentCount,
        absent: absentCount,
        attendanceRate: totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0,
      },
      dailyBreakdown: Object.entries(dailyBreakdown)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
          date,
          ...stats,
        })),
      weeklyBreakdown,
      byRole: Object.entries(byRole).map(([role, stats]) => ({
        role,
        ...stats,
        attendanceRate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
      })),
      byCampus: Object.entries(byCampus).map(([campus, stats]) => ({
        campus,
        ...stats,
        attendanceRate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
      })),
      topAttendees: Object.values(topAttendees)
        .sort((a, b) => b.present - a.present)
        .slice(0, 20)
        .map((item) => ({
          name: `${item.user.firstName} ${item.user.lastName}`,
          role: item.user.role,
          present: item.present,
          total: item.total,
          attendanceRate: item.total > 0 ? (item.present / item.total) * 100 : 0,
        })),
    });
  } catch (error: any) {
    console.error("Error generating attendance report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

