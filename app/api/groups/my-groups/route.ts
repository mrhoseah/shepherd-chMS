import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get groups where the current user is a member
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get groups where user is a member
    const groupMemberships = await prisma.groupMember.findMany({
      where: {
        userId,
        leftAt: null, // Only active memberships
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            groupGivingEnabled: true,
            leader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        group: {
          name: "asc",
        },
      },
    });

    const groups = groupMemberships.map((membership) => ({
      ...membership.group,
      role: membership.role,
      isLeader: membership.isLeader,
      joinedAt: membership.joinedAt,
    }));

    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error("Error fetching user groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

