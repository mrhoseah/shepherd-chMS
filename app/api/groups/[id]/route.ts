import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single group with full hierarchy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.smallGroup.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        subgroups: {
          include: {
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
        },
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
          orderBy: [
            { isLeader: "desc" },
            { role: "asc" },
            { joinedAt: "asc" },
          ],
        },
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            subgroups: true,
            meetings: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

// PATCH - Update group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      isActive,
    } = body;

    // Prevent circular references
    if (parentId === id) {
      return NextResponse.json(
        { error: "A group cannot be its own parent" },
        { status: 400 }
      );
    }

    // Check if parent would create a cycle
    if (parentId) {
      const potentialParent = await prisma.smallGroup.findUnique({
        where: { id: parentId },
        select: { parentId: true },
      });
      if (potentialParent?.parentId === id) {
        return NextResponse.json(
          { error: "Cannot create circular group hierarchy" },
          { status: 400 }
        );
      }
    }

    // Handle parentId - convert "none" or empty string to null
    const normalizedParentId =
      parentId !== undefined
        ? parentId && parentId !== "none"
          ? parentId
          : null
        : undefined;

    const group = await prisma.smallGroup.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(normalizedParentId !== undefined && { parentId: normalizedParentId }),
        ...(leaderId !== undefined && { leaderId: leaderId || null }),
        ...(campusId !== undefined && { campusId: campusId || null }),
        ...(meetingDay !== undefined && { meetingDay: meetingDay || null }),
        ...(meetingTime !== undefined && { meetingTime: meetingTime || null }),
        ...(meetingLocation !== undefined && { meetingLocation: meetingLocation || null }),
        ...(useRotation !== undefined && { useRotation }),
        ...(isActive !== undefined && { isActive }),
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

    // Update leader membership if leaderId changed
    if (leaderId !== undefined) {
      // Remove old leader flag
      await prisma.groupMember.updateMany({
        where: {
          groupId: id,
          isLeader: true,
        },
        data: {
          isLeader: false,
          role: "member",
        },
      });

      // Add new leader
      if (leaderId) {
        const existingMember = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId: id,
              userId: leaderId,
            },
          },
        });

        if (existingMember) {
          await prisma.groupMember.update({
            where: { id: existingMember.id },
            data: {
              role: "leader",
              isLeader: true,
            },
          });
        } else {
          await prisma.groupMember.create({
            data: {
              groupId: id,
              userId: leaderId,
              role: "leader",
              isLeader: true,
            },
          });
        }
      }
    }

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("Error updating group:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if group has subgroups
    const group = await prisma.smallGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subgroups: true,
            members: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group._count.subgroups > 0) {
      return NextResponse.json(
        { error: "Cannot delete group with subgroups. Please delete or reassign subgroups first." },
        { status: 400 }
      );
    }

    await prisma.smallGroup.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting group:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}

