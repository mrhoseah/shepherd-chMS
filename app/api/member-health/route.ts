import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Member Health Dashboard API
 * Calculates comprehensive health scores for members
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get("memberId");
    const filter = searchParams.get("filter") || "all"; // all, healthy, at-risk, critical

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (memberId) {
      // Get health for specific member
      const member = await prisma.user.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          memberSince: true,
          baptismDate: true,
        },
      });

      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      const health = await calculateMemberHealth(member.id, {
        threeMonthsAgo,
        sixMonthsAgo,
        oneYearAgo,
        now,
      });

      return NextResponse.json({
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          phone: member.phone,
          role: member.role,
          status: member.status,
        },
        health,
      });
    }

    // Get health for all members
    const members = await prisma.user.findMany({
      where: {
        role: { not: "GUEST" },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        memberSince: true,
      },
      take: 500, // Limit for performance
    });

    // Calculate health for all members in parallel
    const healthPromises = members.map((member) =>
      calculateMemberHealth(member.id, {
        threeMonthsAgo,
        sixMonthsAgo,
        oneYearAgo,
        now,
      }).then((health) => ({
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          role: member.role,
          status: member.status,
        },
        health,
      }))
    );

    const membersWithHealth = await Promise.all(healthPromises);

    // Filter based on health status
    let filtered = membersWithHealth;
    if (filter === "healthy") {
      filtered = membersWithHealth.filter((m) => m.health.overallScore >= 70);
    } else if (filter === "at-risk") {
      filtered = membersWithHealth.filter(
        (m) => m.health.overallScore >= 40 && m.health.overallScore < 70
      );
    } else if (filter === "critical") {
      filtered = membersWithHealth.filter((m) => m.health.overallScore < 40);
    }

    // Calculate statistics
    const stats = {
      total: membersWithHealth.length,
      healthy: membersWithHealth.filter((m) => m.health.overallScore >= 70).length,
      atRisk: membersWithHealth.filter(
        (m) => m.health.overallScore >= 40 && m.health.overallScore < 70
      ).length,
      critical: membersWithHealth.filter((m) => m.health.overallScore < 40).length,
      averageScore: membersWithHealth.length > 0
        ? Math.round(
            membersWithHealth.reduce((sum, m) => sum + m.health.overallScore, 0) /
              membersWithHealth.length
          )
        : 0,
    };

    // Health distribution
    const distribution = {
      excellent: membersWithHealth.filter((m) => m.health.overallScore >= 90).length,
      good: membersWithHealth.filter(
        (m) => m.health.overallScore >= 70 && m.health.overallScore < 90
      ).length,
      fair: membersWithHealth.filter(
        (m) => m.health.overallScore >= 50 && m.health.overallScore < 70
      ).length,
      poor: membersWithHealth.filter(
        (m) => m.health.overallScore >= 30 && m.health.overallScore < 50
      ).length,
      critical: membersWithHealth.filter((m) => m.health.overallScore < 30).length,
    };

    // Top concerns
    const concerns = {
      noRecentAttendance: membersWithHealth.filter(
        (m) => m.health.factors.attendanceScore === 0 && m.health.factors.attendanceCount === 0
      ).length,
      noRecentGiving: membersWithHealth.filter(
        (m) => m.health.factors.givingScore === 0 && m.health.factors.givingCount === 0
      ).length,
      noGroupMembership: membersWithHealth.filter(
        (m) => m.health.factors.groupScore === 0
      ).length,
      decliningEngagement: membersWithHealth.filter(
        (m) => m.health.trend === "declining"
      ).length,
    };

    return NextResponse.json({
      members: filtered,
      stats,
      distribution,
      concerns,
    });
  } catch (error: any) {
    console.error("Error calculating member health:", error);
    return NextResponse.json(
      { error: "Failed to calculate member health" },
      { status: 500 }
    );
  }
}

/**
 * Calculate comprehensive health score for a member
 */
async function calculateMemberHealth(
  memberId: string,
  dates: {
    threeMonthsAgo: Date;
    sixMonthsAgo: Date;
    oneYearAgo: Date;
    now: Date;
  }
) {
  const { threeMonthsAgo, sixMonthsAgo, oneYearAgo, now } = dates;

  // Attendance Health (0-100)
  const [recentAttendance, oldAttendance, totalAttendance] = await Promise.all([
    prisma.attendance.count({
      where: {
        userId: memberId,
        status: "PRESENT",
        createdAt: { gte: threeMonthsAgo },
      },
    }),
    prisma.attendance.count({
      where: {
        userId: memberId,
        status: "PRESENT",
        createdAt: {
          gte: sixMonthsAgo,
          lt: threeMonthsAgo,
        },
      },
    }),
    prisma.attendance.count({
      where: {
        userId: memberId,
        status: "PRESENT",
        createdAt: { gte: oneYearAgo },
      },
    }),
  ]);

  const attendanceScore = Math.min(100, (recentAttendance / 12) * 100); // Assuming 12 services in 3 months
  const attendanceTrend = oldAttendance > 0
    ? ((recentAttendance - oldAttendance) / oldAttendance) * 100
    : 0;

  // Giving Health (0-100)
  const [recentGiving, oldGiving, totalGiving] = await Promise.all([
    prisma.donation.findMany({
      where: {
        userId: memberId,
        status: "completed",
        createdAt: { gte: threeMonthsAgo },
      },
      select: { amount: true },
    }),
    prisma.donation.findMany({
      where: {
        userId: memberId,
        status: "completed",
        createdAt: {
          gte: sixMonthsAgo,
          lt: threeMonthsAgo,
        },
      },
      select: { amount: true },
    }),
    prisma.donation.findMany({
      where: {
        userId: memberId,
        status: "completed",
        createdAt: { gte: oneYearAgo },
      },
      select: { amount: true },
    }),
  ]);

  const recentGivingTotal = recentGiving.reduce((sum, d) => sum + Number(d.amount), 0);
  const oldGivingTotal = oldGiving.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalGivingAmount = totalGiving.reduce((sum, d) => sum + Number(d.amount), 0);

  // Giving score based on consistency and amount
  const givingConsistency = recentGiving.length > 0 ? Math.min(100, recentGiving.length * 20) : 0;
  const givingAmount = totalGivingAmount > 0
    ? Math.min(50, (recentGivingTotal / (totalGivingAmount / 4)) * 50) // 25% of yearly in 3 months
    : 0;
  const givingScore = givingConsistency + givingAmount;
  const givingTrend = oldGivingTotal > 0
    ? ((recentGivingTotal - oldGivingTotal) / oldGivingTotal) * 100
    : 0;

  // Group Participation Health (0-100)
  const [groupMemberships, groupAttendance] = await Promise.all([
    prisma.groupMember.count({
      where: {
        userId: memberId,
        leftAt: null,
      },
    }),
    prisma.groupMeetingAttendance.count({
      where: {
        userId: memberId,
        createdAt: { gte: threeMonthsAgo },
      },
    }),
  ]);

  const groupScore = Math.min(100, groupMemberships * 30 + Math.min(40, groupAttendance * 5));

  // Event Participation Health (0-100)
  const [eventRegistrations, eventCheckIns] = await Promise.all([
    prisma.eventRegistration.count({
      where: {
        userId: memberId,
        createdAt: { gte: threeMonthsAgo },
      },
    }),
    prisma.eventCheckIn.count({
      where: {
        userId: memberId,
        createdAt: { gte: threeMonthsAgo },
      },
    }),
  ]);

  const eventScore = Math.min(100, eventRegistrations * 20 + eventCheckIns * 15);

  // Communication Health (0-100)
  const [messagesSent, messagesReceived, announcementsRead] = await Promise.all([
    prisma.message.count({
      where: {
        senderId: memberId,
        createdAt: { gte: threeMonthsAgo },
      },
    }),
    prisma.message.count({
      where: {
        recipientId: memberId,
        createdAt: { gte: threeMonthsAgo },
      },
    }),
    prisma.announcementRead.count({
      where: {
        userId: memberId,
        createdAt: { gte: threeMonthsAgo },
      },
    }),
  ]);

  const communicationScore = Math.min(
    100,
    messagesSent * 5 + messagesReceived * 3 + announcementsRead * 2
  );

  // Volunteer Participation (0-100)
  const volunteerAssignments = await prisma.volunteerAssignment.count({
    where: {
      userId: memberId,
      date: { gte: threeMonthsAgo },
    },
  });

  const volunteerScore = Math.min(100, volunteerAssignments * 15);

  // Calculate overall health score (weighted average)
  const overallScore = Math.round(
    attendanceScore * 0.30 + // 30% weight
    givingScore * 0.20 + // 20% weight
    groupScore * 0.20 + // 20% weight
    eventScore * 0.10 + // 10% weight
    communicationScore * 0.10 + // 10% weight
    volunteerScore * 0.10 // 10% weight
  );

  // Determine trend
  let trend: "improving" | "stable" | "declining" = "stable";
  if (attendanceTrend < -20 || givingTrend < -30) {
    trend = "declining";
  } else if (attendanceTrend > 20 || givingTrend > 30) {
    trend = "improving";
  }

  // Determine status
  let status: "excellent" | "good" | "fair" | "poor" | "critical" = "fair";
  if (overallScore >= 90) status = "excellent";
  else if (overallScore >= 70) status = "good";
  else if (overallScore >= 50) status = "fair";
  else if (overallScore >= 30) status = "poor";
  else status = "critical";

  // Identify concerns
  const concerns: string[] = [];
  if (attendanceScore === 0) concerns.push("No recent attendance");
  if (givingScore === 0) concerns.push("No recent giving");
  if (groupScore === 0) concerns.push("Not in any groups");
  if (eventScore === 0) concerns.push("No event participation");
  if (communicationScore === 0) concerns.push("No communication activity");
  if (trend === "declining") concerns.push("Declining engagement");
  if (overallScore < 40) concerns.push("Critical health status");

  return {
    overallScore,
    status,
    trend,
    concerns,
    factors: {
      attendanceScore: Math.round(attendanceScore),
      attendanceCount: recentAttendance,
      attendanceTrend,
      givingScore: Math.round(givingScore),
      givingCount: recentGiving.length,
      givingAmount: recentGivingTotal,
      givingTrend,
      groupScore: Math.round(groupScore),
      groupCount: groupMemberships,
      eventScore: Math.round(eventScore),
      eventCount: eventRegistrations,
      communicationScore: Math.round(communicationScore),
      volunteerScore: Math.round(volunteerScore),
      volunteerCount: volunteerAssignments,
    },
    lastUpdated: now.toISOString(),
  };
}

