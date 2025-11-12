import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";

// GET - Get members report
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

    // Get all members
    const members = await prisma.user.findMany({
      where: {
        role: { in: ["MEMBER", "LEADER", "PASTOR", "ADMIN"] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        city: true,
        country: true,
        memberSince: true,
        createdAt: true,
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            attendances: true,
            donations: true,
          },
        },
      },
    });

    // Get attendance data
    const attendances = await prisma.attendance.findMany({
      where: dateFilter
        ? {
            date: {
              gte: dateFilter.gte,
              lte: dateFilter.lte,
            },
          }
        : undefined,
      select: {
        userId: true,
        date: true,
        status: true,
      },
    });

    // Statistics
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "ACTIVE").length;
    const newMembers = members.filter((m) => {
      if (!dateFilter || !m.memberSince) return false;
      return new Date(m.memberSince) >= dateFilter.gte;
    }).length;

    // By role
    const byRole = members.reduce((acc, member) => {
      if (!acc[member.role]) {
        acc[member.role] = 0;
      }
      acc[member.role]++;
      return acc;
    }, {} as Record<string, number>);

    // By status
    const byStatus = members.reduce((acc, member) => {
      if (!acc[member.status]) {
        acc[member.status] = 0;
      }
      acc[member.status]++;
      return acc;
    }, {} as Record<string, number>);

    // By location
    const byLocation = members.reduce((acc, member) => {
      const location = member.city || member.country || "Unknown";
      if (!acc[location]) {
        acc[location] = 0;
      }
      acc[location]++;
      return acc;
    }, {} as Record<string, number>);

    // Attendance statistics
    const attendanceStats = attendances.reduce(
      (acc, att) => {
        if (att.status === "PRESENT") {
          acc.present++;
        } else if (att.status === "ABSENT") {
          acc.absent++;
        }
        acc.total++;
        return acc;
      },
      { present: 0, absent: 0, total: 0 }
    );

    // Monthly member growth
    const monthlyGrowth = members
      .filter((m) => m.memberSince)
      .reduce((acc, member) => {
        const month = new Date(member.memberSince!).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month]++;
        return acc;
      }, {} as Record<string, number>);

    return NextResponse.json({
      reportType: "members",
      period: dateFilter,
      summary: {
        totalMembers,
        activeMembers,
        newMembers,
        inactiveMembers: totalMembers - activeMembers,
      },
      byRole: Object.entries(byRole).map(([role, count]) => ({
        role,
        count,
        percentage: (count / totalMembers) * 100,
      })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({
        status,
        count,
        percentage: (count / totalMembers) * 100,
      })),
      byLocation: Object.entries(byLocation)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([location, count]) => ({
          location,
          count,
          percentage: (count / totalMembers) * 100,
        })),
      attendance: {
        total: attendanceStats.total,
        present: attendanceStats.present,
        absent: attendanceStats.absent,
        averageAttendance: totalMembers > 0 ? attendanceStats.present / totalMembers : 0,
      },
      monthlyGrowth: Object.entries(monthlyGrowth)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([month, count]) => ({
          month,
          count,
        })),
      members: members.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        email: m.email,
        phone: m.phone,
        role: m.role,
        status: m.status,
        location: m.city || m.country || "Unknown",
        campus: m.campus?.name,
        memberSince: m.memberSince,
        attendanceCount: m._count.attendances,
        donationCount: m._count.donations,
      })),
    });
  } catch (error: any) {
    console.error("Error generating members report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

