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
    const filter = searchParams.get("filter") || "all";

    // Get all members
    const users = await prisma.user.findMany({
      where: {
        role: { not: "GUEST" },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Calculate engagement scores for each member
    const members = await Promise.all(
      users.map(async (user) => {
        // Attendance score (0-100)
        const attendanceRecords = await prisma.attendance.count({
          where: {
            userId: user.id,
            status: "PRESENT",
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
        });
        const attendanceScore = Math.min(100, (attendanceRecords / 12) * 100); // Assuming 12 services in 90 days

        // Giving score (0-100)
        const donations = await prisma.donation.count({
          where: {
            donorId: user.id,
            status: "completed",
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        });
        const givingScore = Math.min(100, donations * 20); // 5 donations = 100%

        // Participation score (groups, events, etc.)
        const groupMemberships = await prisma.groupMember.count({
          where: { userId: user.id },
        });
        const eventRegistrations = await prisma.eventRegistration.count({
          where: {
            userId: user.id,
            status: "CONFIRMED",
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        });
        const participationScore = Math.min(100, (groupMemberships * 30 + eventRegistrations * 10));

        // Communication score (messages, responses, etc.)
        const messages = await prisma.message.count({
          where: {
            senderId: user.id,
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        });
        const communicationScore = Math.min(100, messages * 5);

        // Overall score (weighted average)
        const overallScore = Math.round(
          attendanceScore * 0.4 +
          givingScore * 0.2 +
          participationScore * 0.2 +
          communicationScore * 0.2
        );

        // Determine status
        let status: "high" | "medium" | "low" | "at-risk" = "medium";
        if (overallScore >= 80) status = "high";
        else if (overallScore >= 60) status = "medium";
        else if (overallScore >= 40) status = "low";
        else status = "at-risk";

        // Determine trend (simplified - would need historical data for real trend)
        const trend: "up" | "down" | "stable" = "stable";

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email || "",
          overallScore,
          attendanceScore: Math.round(attendanceScore),
          givingScore: Math.round(givingScore),
          participationScore: Math.round(participationScore),
          communicationScore: Math.round(communicationScore),
          trend,
          status,
        };
      })
    );

    // Filter members
    let filteredMembers = members;
    if (filter !== "all") {
      filteredMembers = members.filter((m) => m.status === filter);
    }

    // Sort by overall score (descending)
    filteredMembers.sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({ members: filteredMembers });
  } catch (error: any) {
    console.error("Error fetching engagement:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement data" },
      { status: 500 }
    );
  }
}

