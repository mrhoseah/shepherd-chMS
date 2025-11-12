import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Members data
    const [totalMembers, newThisMonth, newLastMonth] = await Promise.all([
      prisma.user.count({ where: { role: { in: ["MEMBER", "LEADER", "PASTOR", "ADMIN"] } } }),
      prisma.user.count({
        where: {
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
          role: { in: ["MEMBER", "LEADER", "PASTOR", "ADMIN"] },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          role: { in: ["MEMBER", "LEADER", "PASTOR", "ADMIN"] },
        },
      }),
    ]);

    const memberGrowth = newLastMonth > 0
      ? ((newThisMonth - newLastMonth) / newLastMonth) * 100
      : newThisMonth > 0 ? 100 : 0;

    // Giving data
    const [thisMonthGiving, lastMonthGiving] = await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
          status: "completed",
        },
      }),
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          status: "completed",
        },
      }),
    ]);

    const thisMonthGivingAmount = Number(thisMonthGiving._sum.amount || 0);
    const lastMonthGivingAmount = Number(lastMonthGiving._sum.amount || 0);
    const givingGrowth = lastMonthGivingAmount > 0
      ? ((thisMonthGivingAmount - lastMonthGivingAmount) / lastMonthGivingAmount) * 100
      : thisMonthGivingAmount > 0 ? 100 : 0;

    // Attendance data
    const [thisMonthAttendance, lastMonthAttendance] = await Promise.all([
      prisma.attendance.count({
        where: {
          date: { gte: thisMonthStart, lte: thisMonthEnd },
          status: "PRESENT",
        },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: lastMonthStart, lte: lastMonthEnd },
          status: "PRESENT",
        },
      }),
    ]);

    const attendanceGrowth = lastMonthAttendance > 0
      ? ((thisMonthAttendance - lastMonthAttendance) / lastMonthAttendance) * 100
      : thisMonthAttendance > 0 ? 100 : 0;

    // Events data
    const [upcomingEvents, thisMonthEvents] = await Promise.all([
      prisma.event.count({
        where: {
          startDate: { gte: now },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.event.count({
        where: {
          startDate: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      }),
    ]);

    return NextResponse.json({
      members: {
        total: totalMembers,
        newThisMonth,
        growth: memberGrowth,
      },
      giving: {
        thisMonth: thisMonthGivingAmount,
        lastMonth: lastMonthGivingAmount,
        growth: givingGrowth,
      },
      attendance: {
        thisMonth: thisMonthAttendance,
        lastMonth: lastMonthAttendance,
        growth: attendanceGrowth,
      },
      events: {
        upcoming: upcomingEvents,
        thisMonth: thisMonthEvents,
      },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

