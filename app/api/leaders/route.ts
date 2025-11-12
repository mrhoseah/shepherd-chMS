import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Leaders API
 * Get all leaders and their assignments (groups, departments, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || ""; // Filter by specific role

    // Build where clause for leaders
    // Leaders are: ADMIN, PASTOR, LEADER roles
    const where: any = {
      role: { in: ["ADMIN", "PASTOR", "LEADER"] },
      status: "ACTIVE",
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Get all leaders with their assignments
    const leaders = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        profileImage: true,
        // Groups they lead
        groupLeadership: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        // Departments they lead
        departmentLeader: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            _count: {
              select: {
                staff: true,
              },
            },
          },
        },
        // Children classes they lead
        childrenLeadership: {
          select: {
            id: true,
            name: true,
            ageMin: true,
            ageMax: true,
            capacity: true,
          },
        },
        // Youth groups they lead
        youthLeadership: {
          select: {
            id: true,
            name: true,
            ageMin: true,
            ageMax: true,
            description: true,
          },
        },
        // Group memberships where they are leaders
        groupMemberships: {
          where: {
            isLeader: true,
            role: { in: ["leader", "co-leader", "assistant-leader"] },
            leftAt: null,
          },
          select: {
            id: true,
            role: true,
            group: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    // Format the response
    const formattedLeaders = leaders.map((leader) => ({
      id: leader.id,
      name: `${leader.firstName} ${leader.lastName}`,
      firstName: leader.firstName,
      lastName: leader.lastName,
      email: leader.email,
      phone: leader.phone,
      role: leader.role,
      status: leader.status,
      profileImage: leader.profileImage,
      // Count total assignments
      totalAssignments:
        leader.groupLeadership.length +
        leader.departmentLeader.length +
        leader.childrenLeadership.length +
        leader.youthLeadership.length +
        leader.groupMemberships.length,
      // Detailed assignments
      assignments: {
        groups: leader.groupLeadership.map((g) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          description: g.description,
          memberCount: g._count.members,
          assignmentType: "primary",
        })),
        departments: leader.departmentLeader.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          isActive: d.isActive,
          memberCount: d._count.staff,
          assignmentType: "primary",
        })),
        childrenClasses: leader.childrenLeadership.map((c) => ({
          id: c.id,
          name: c.name,
          ageRange: `${c.ageMin}-${c.ageMax}`,
          capacity: c.capacity,
          assignmentType: "primary",
        })),
        youthGroups: leader.youthLeadership.map((y) => ({
          id: y.id,
          name: y.name,
          ageRange: `${y.ageMin}-${y.ageMax}`,
          description: y.description,
          assignmentType: "primary",
        })),
        groupMemberships: leader.groupMemberships.map((gm) => ({
          id: gm.group.id,
          name: gm.group.name,
          type: gm.group.type,
          role: gm.role,
          assignmentType: "member-leader",
        })),
      },
    }));

    return NextResponse.json({ leaders: formattedLeaders });
  } catch (error: any) {
    console.error("Error fetching leaders:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaders" },
      { status: 500 }
    );
  }
}

