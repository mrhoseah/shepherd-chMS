import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Member Journey Tracking API
 * Tracks member lifecycle stages and milestones
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get("memberId");
    const stage = searchParams.get("stage");

    if (memberId) {
      // Get journey for specific member
      const member = await prisma.user.findUnique({
        where: { id: memberId },
        include: {
          attendances: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
          donations: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
          groupMemberships: {
            orderBy: { joinedAt: "asc" },
            take: 1,
          },
          eventRegistrations: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      });

      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      // Determine current stage
      const stages = {
        visitor: {
          name: "Visitor",
          completed: true,
          date: member.createdAt,
          description: "First contact with the church",
        },
        guest: {
          name: "Guest",
          completed: member.role === "GUEST" || member.role !== "GUEST",
          date: member.createdAt,
          description: "Registered as guest",
        },
        firstAttendance: {
          name: "First Attendance",
          completed: member.attendances.length > 0,
          date: member.attendances[0]?.createdAt || null,
          description: "Attended first service",
        },
        firstGiving: {
          name: "First Giving",
          completed: member.donations.length > 0,
          date: member.donations[0]?.createdAt || null,
          description: "Made first donation",
        },
        member: {
          name: "Member",
          completed: member.role === "MEMBER" || member.role === "LEADER" || member.role === "PASTOR",
          date: member.memberSince || null,
          description: "Became a member",
        },
        baptized: {
          name: "Baptized",
          completed: !!member.baptismDate,
          date: member.baptismDate,
          description: "Completed baptism",
        },
        groupMember: {
          name: "Group Member",
          completed: member.groupMemberships.length > 0,
          date: member.groupMemberships[0]?.joinedAt || null,
          description: "Joined a small group",
        },
        eventParticipant: {
          name: "Event Participant",
          completed: member.eventRegistrations.length > 0,
          date: member.eventRegistrations[0]?.createdAt || null,
          description: "Registered for an event",
        },
        leader: {
          name: "Leader",
          completed: member.role === "LEADER" || member.role === "PASTOR" || member.role === "ADMIN",
          date: member.role === "LEADER" || member.role === "PASTOR" || member.role === "ADMIN" ? member.memberSince : null,
          description: "Became a leader",
        },
      };

      // Calculate journey progress
      const completedStages = Object.values(stages).filter((s) => s.completed).length;
      const totalStages = Object.keys(stages).length;
      const progress = (completedStages / totalStages) * 100;

      // Determine current stage name
      let currentStage = "Visitor";
      if (stages.leader.completed) currentStage = "Leader";
      else if (stages.member.completed) currentStage = "Member";
      else if (stages.groupMember.completed) currentStage = "Group Member";
      else if (stages.firstGiving.completed) currentStage = "First Giving";
      else if (stages.firstAttendance.completed) currentStage = "First Attendance";
      else if (stages.guest.completed) currentStage = "Guest";

      return NextResponse.json({
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          currentStage,
          progress: Math.round(progress),
        },
        stages,
        milestones: Object.entries(stages)
          .filter(([_, stage]) => stage.completed && stage.date)
          .map(([key, stage]) => ({
            key,
            ...stage,
          })),
      });
    }

    // Get all members by stage
    const where: any = {};
    if (stage) {
      switch (stage) {
        case "visitor":
          where.createdAt = {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          };
          break;
        case "guest":
          where.role = "GUEST";
          break;
        case "member":
          where.role = { in: ["MEMBER", "LEADER", "PASTOR"] };
          break;
        case "leader":
          where.role = { in: ["LEADER", "PASTOR", "ADMIN"] };
          break;
      }
    }

    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        memberSince: true,
        baptismDate: true,
        _count: {
          select: {
            attendances: true,
            donations: true,
            groupMemberships: true,
          },
        },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    // Get stage statistics
    const stats = {
      visitor: await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      guest: await prisma.user.count({ where: { role: "GUEST" } }),
      member: await prisma.user.count({
        where: { role: { in: ["MEMBER", "LEADER", "PASTOR"] } },
      }),
      leader: await prisma.user.count({
        where: { role: { in: ["LEADER", "PASTOR", "ADMIN"] } },
      }),
      baptized: await prisma.user.count({
        where: { baptismDate: { not: null } },
      }),
    };

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        email: m.email,
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
        memberSince: m.memberSince,
        baptismDate: m.baptismDate,
        activityCounts: {
          attendances: m._count.attendances,
          donations: m._count.donations,
          groups: m._count.groupMemberships,
        },
      })),
      stats,
    });
  } catch (error: any) {
    console.error("Error fetching member journey:", error);
    return NextResponse.json(
      { error: "Failed to fetch member journey" },
      { status: 500 }
    );
  }
}

