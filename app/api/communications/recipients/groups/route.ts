import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get group recipients with hierarchy support
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const includeSubgroups = searchParams.get("includeSubgroups") === "true";

    if (groupId) {
      // Get specific group and optionally all its subgroups
      const group = await prisma.smallGroup.findUnique({
        where: { id: groupId },
        include: {
          members: {
            where: { leftAt: null },
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
          subgroups: includeSubgroups
            ? {
                include: {
                  members: {
                    where: { leftAt: null },
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
                },
              }
            : false,
        },
      });

      if (!group) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }

      // Collect all unique recipients
      const recipients = new Map();
      
      // Add direct group members
      group.members.forEach((member) => {
        if (member.user.email || member.user.phone) {
          recipients.set(member.user.id, member.user);
        }
      });

      // Add subgroup members if requested
      if (includeSubgroups && group.subgroups) {
        group.subgroups.forEach((subgroup) => {
          subgroup.members.forEach((member) => {
            if (member.user.email || member.user.phone) {
              recipients.set(member.user.id, member.user);
            }
          });
        });
      }

      return NextResponse.json({
        recipients: Array.from(recipients.values()),
        group: {
          id: group.id,
          name: group.name,
          type: group.type,
        },
      });
    }

    // Get all groups
    const groups = await prisma.smallGroup.findMany({
      where: { isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            members: {
              where: { leftAt: null },
            },
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
    console.error("Error fetching group recipients:", error);
    return NextResponse.json(
      { error: "Failed to fetch group recipients" },
      { status: 500 }
    );
  }
}

