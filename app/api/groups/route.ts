import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all groups with hierarchy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get("parentId");
    const type = searchParams.get("type");
    const includeSubgroups = searchParams.get("includeSubgroups") === "true";

    const where: any = {
      isActive: true,
    };

    if (parentId === "null" || parentId === "") {
      where.parentId = null; // Top-level groups only
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (type) {
      where.type = type;
    }

    const groups = await prisma.smallGroup.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        subgroups: includeSubgroups
          ? {
              include: {
                leader: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                leadershipAssignments: {
                  where: {
                    OR: [
                      { endDate: null },
                      { endDate: { gte: new Date() } },
                    ],
                  },
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                  orderBy: [
                    { isPrimary: "desc" },
                    { displayOrder: "asc" },
                  ],
                },
                _count: {
                  select: { members: true, subgroups: true },
                },
              },
            }
          : false,
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        leadershipAssignments: {
          where: {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
          },
          orderBy: [
            { isPrimary: "desc" },
            { displayOrder: "asc" },
            { startDate: "desc" },
          ],
        },
        members: {
          where: {
            isLeader: true,
            role: { in: ["leader", "co-leader", "assistant-leader"] },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            subgroups: true,
          },
        },
      },
      orderBy: [
        { type: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST - Create new group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      parentId,
      leaderId,
      campusId,
      meetingDay,
      meetingTime,
      meetingLocation,
      useRotation,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // Handle parentId - convert "none" or empty string to null
    const normalizedParentId = parentId && parentId !== "none" ? parentId : null;

    const group = await prisma.smallGroup.create({
      data: {
        name,
        description: description || null,
        type: type || null,
        parentId: normalizedParentId,
        leaderId: leaderId || null,
        campusId: campusId || null,
        meetingDay: meetingDay || null,
        meetingTime: meetingTime || null,
        meetingLocation: meetingLocation || null,
        useRotation: useRotation || false,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
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
            subgroups: true,
          },
        },
      },
    });

    // If leaderId is provided, add as leader member
    if (leaderId) {
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: leaderId,
          role: "leader",
          isLeader: true,
        },
      });
    }

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    console.error("Error creating group:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Group name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}

