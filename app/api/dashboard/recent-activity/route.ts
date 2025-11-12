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

    // Get recent activity logs
    const activityLogs = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get recent donations
    const recentDonations = await prisma.donation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get recent events
    const recentEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Combine and format activities
    const activities = [
      ...activityLogs.map((log) => ({
        id: log.id,
        type: "activity",
        action: log.action,
        user: log.user,
        createdAt: log.createdAt.toISOString(),
      })),
      ...recentDonations.map((donation) => ({
        id: `donation-${donation.id}`,
        type: "donation",
        action: `made a donation of $${Number(donation.amount).toLocaleString()}`,
        user: donation.user,
        createdAt: donation.createdAt.toISOString(),
      })),
      ...recentEvents.map((event) => ({
        id: `event-${event.id}`,
        type: "event",
        action: `created event "${event.title}"`,
        user: null,
        createdAt: event.createdAt.toISOString(),
      })),
      ...recentUsers.map((user) => ({
        id: `user-${user.id}`,
        type: "user",
        action: "joined the church",
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
        createdAt: user.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

