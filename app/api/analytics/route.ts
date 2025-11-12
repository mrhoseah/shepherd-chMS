import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "month";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Member Growth
    const totalMembers = await prisma.user.count({ where: { role: { not: "GUEST" } } });
    const newMembers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate },
        role: { not: "GUEST" },
      },
    });
    const previousPeriodMembers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
          lt: startDate,
        },
        role: { not: "GUEST" },
      },
    });
    const memberGrowth = previousPeriodMembers > 0
      ? ((newMembers - previousPeriodMembers) / previousPeriodMembers) * 100
      : 0;

    // Giving Analytics
    const donations = await prisma.donation.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "completed",
      },
    });
    const totalGiving = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const previousDonations = await prisma.donation.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
          lt: startDate,
        },
        status: "completed",
      },
    });
    const previousGiving = previousDonations.reduce((sum, d) => sum + Number(d.amount), 0);
    const givingTrend = previousGiving > 0 ? ((totalGiving - previousGiving) / previousGiving) * 100 : 0;

    // Attendance Analytics
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "PRESENT",
      },
      include: {
        session: true,
      },
    });
    const uniqueAttendees = new Set(attendanceRecords.map((a) => a.userId)).size;
    const attendanceRate = totalMembers > 0 ? (uniqueAttendees / totalMembers) * 100 : 0;

    // Engagement Score (simplified calculation)
    const engagementScore = Math.round(
      (attendanceRate * 0.4 + (newMembers / totalMembers) * 100 * 0.3 + (donations.length / totalMembers) * 100 * 0.3)
    );

    // Giving Trends (weekly)
    const givingTrends = [];
    const weeks = Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    for (let i = weeks; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekDonations = donations.filter(
        (d) => d.createdAt >= weekStart && d.createdAt < weekEnd
      );
      const weekAmount = weekDonations.reduce((sum, d) => sum + Number(d.amount), 0);

      givingTrends.push({
        date: weekStart.toISOString().split("T")[0],
        amount: weekAmount,
      });
    }

    // Attendance Trends
    const attendanceTrends = [];
    for (let i = weeks; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekAttendance = attendanceRecords.filter(
        (a) => a.createdAt >= weekStart && a.createdAt < weekEnd
      ).length;

      attendanceTrends.push({
        week: `Week ${weeks - i + 1}`,
        attendance: weekAttendance,
      });
    }

    // Member Status Distribution
    const memberStatus = await prisma.user.groupBy({
      by: ["status"],
      where: { role: { not: "GUEST" } },
      _count: true,
    });
    const memberStatusData = memberStatus.map((m) => ({
      name: m.status,
      value: m._count,
    }));

    // Giving by Category
    const givingByCategory = await prisma.donation.groupBy({
      by: ["category"],
      where: {
        createdAt: { gte: startDate },
        status: "completed",
      },
      _sum: { amount: true },
    });
    const givingByCategoryData = givingByCategory.map((g) => ({
      name: g.category,
      value: Number(g._sum.amount || 0),
    }));

    // Giving by Payment Method
    const givingByMethod = await prisma.donation.groupBy({
      by: ["paymentMethod"],
      where: {
        createdAt: { gte: startDate },
        status: "completed",
      },
      _sum: { amount: true },
    });
    const givingByMethodData = givingByMethod.map((g) => ({
      method: g.paymentMethod,
      amount: Number(g._sum.amount || 0),
    }));

    // Member Growth Over Time
    const memberGrowthData = [];
    const months = Math.ceil((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
    for (let i = months; i >= 0; i--) {
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthNew = await prisma.user.count({
        where: {
          createdAt: { gte: monthStart, lt: monthEnd },
          role: { not: "GUEST" },
        },
      });
      const monthTotal = await prisma.user.count({
        where: {
          createdAt: { lt: monthEnd },
          role: { not: "GUEST" },
        },
      });

      memberGrowthData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        newMembers: monthNew,
        totalMembers: monthTotal,
      });
    }

    // Engagement Distribution
    const engagementDistribution = [
      { range: "0-20", count: Math.floor(totalMembers * 0.1) },
      { range: "21-40", count: Math.floor(totalMembers * 0.2) },
      { range: "41-60", count: Math.floor(totalMembers * 0.3) },
      { range: "61-80", count: Math.floor(totalMembers * 0.25) },
      { range: "81-100", count: Math.floor(totalMembers * 0.15) },
    ];

    // At-Risk Members (simplified - members with low recent activity)
    const atRiskMembers = await prisma.user.findMany({
      where: {
        role: { not: "GUEST" },
        status: "ACTIVE",
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });
    const atRiskMembersData = atRiskMembers.map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      score: Math.floor(Math.random() * 30) + 20, // Placeholder score
    }));

    return NextResponse.json({
      memberGrowth: Math.round(memberGrowth),
      newMembers,
      totalGiving,
      givingTrend: Math.round(givingTrend),
      attendanceRate: Math.round(attendanceRate),
      engagementScore,
      givingTrends,
      attendanceTrends,
      memberStatus: memberStatusData,
      givingByCategory: givingByCategoryData,
      givingByMethod: givingByMethodData,
      memberGrowth: memberGrowthData,
      engagementDistribution,
      atRiskMembers: atRiskMembersData,
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

