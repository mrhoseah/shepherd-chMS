import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Leadership Assignment Detail API
 * Update and delete individual leadership assignments
 */

// PATCH - Update leadership assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      isPrimary,
      displayOrder,
      startDate,
      endDate,
      description,
      notes,
    } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    // If setting as primary, unset other primary assignments for the same entity
    if (isPrimary === true) {
      const assignment = await prisma.leadershipAssignment.findUnique({
        where: { id },
        select: { entityType: true, entityId: true },
      });

      if (assignment) {
        await prisma.leadershipAssignment.updateMany({
          where: {
            id: { not: id },
            entityType: assignment.entityType,
            entityId: assignment.entityId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }
    }

    const updated = await prisma.leadershipAssignment.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({ assignment: updated });
  } catch (error: any) {
    console.error("Error updating leadership assignment:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Leadership assignment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update leadership assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Remove leadership assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.leadershipAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting leadership assignment:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Leadership assignment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete leadership assignment" },
      { status: 500 }
    );
  }
}

