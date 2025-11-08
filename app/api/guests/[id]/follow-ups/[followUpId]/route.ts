import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update follow-up (mark as completed, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { followUpId } = await params;
    const body = await request.json();
    const { status, completedAt, notes, metadata } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === "COMPLETED" && !completedAt) {
        updateData.completedAt = new Date();
      }
    }

    if (completedAt) {
      updateData.completedAt = new Date(completedAt);
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }

    const followUp = await prisma.guestFollowUp.update({
      where: { id: followUpId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(followUp);
  } catch (error: any) {
    console.error("Error updating follow-up:", error);
    return NextResponse.json(
      { error: "Failed to update follow-up" },
      { status: 500 }
    );
  }
}

// DELETE - Delete follow-up
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { followUpId } = await params;

    await prisma.guestFollowUp.delete({
      where: { id: followUpId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting follow-up:", error);
    return NextResponse.json(
      { error: "Failed to delete follow-up" },
      { status: 500 }
    );
  }
}

