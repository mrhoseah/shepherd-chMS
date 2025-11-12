import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single master event
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

    const masterEvent = await prisma.masterEvent.findUnique({
      where: { id },
      include: {
        campus: {
          select: { id: true, name: true },
        },
        group: {
          select: { id: true, name: true },
        },
        servicePlan: {
          select: { id: true, name: true },
        },
        attendanceSessions: {
          orderBy: { date: "desc" },
          take: 10,
          include: {
            _count: {
              select: { attendees: true },
            },
          },
        },
        _count: {
          select: {
            attendanceSessions: true,
          },
        },
      },
    });

    if (!masterEvent) {
      return NextResponse.json({ error: "Master event not found" }, { status: 404 });
    }

    return NextResponse.json(masterEvent);
  } catch (error: any) {
    console.error("Error fetching master event:", error);
    return NextResponse.json(
      { error: "Failed to fetch master event" },
      { status: 500 }
    );
  }
}

// PATCH - Update master event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      recurrencePattern,
      isRecurring,
      campusId,
      groupId,
      defaultStartTime,
      defaultDuration,
      servicePlanId,
      isActive,
      tags,
      notes,
    } = body;

    const masterEvent = await prisma.masterEvent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(type && { type }),
        ...(recurrencePattern !== undefined && { recurrencePattern: recurrencePattern || null }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(campusId !== undefined && { campusId: campusId || null }),
        ...(groupId !== undefined && { groupId: groupId || null }),
        ...(defaultStartTime !== undefined && { defaultStartTime: defaultStartTime || null }),
        ...(defaultDuration !== undefined && { defaultDuration: defaultDuration || null }),
        ...(servicePlanId !== undefined && { servicePlanId: servicePlanId || null }),
        ...(isActive !== undefined && { isActive }),
        ...(tags !== undefined && { tags }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: {
        campus: {
          select: { id: true, name: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(masterEvent);
  } catch (error: any) {
    console.error("Error updating master event:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Master event not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update master event" },
      { status: 500 }
    );
  }
}

// DELETE - Delete master event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if master event has attendance sessions
    const masterEvent = await prisma.masterEvent.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendanceSessions: true,
          },
        },
      },
    });

    if (!masterEvent) {
      return NextResponse.json({ error: "Master event not found" }, { status: 404 });
    }

    if (masterEvent._count.attendanceSessions > 0) {
      return NextResponse.json(
        { error: "Cannot delete master event with attendance sessions. Please delete or reassign sessions first." },
        { status: 400 }
      );
    }

    await prisma.masterEvent.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Master event deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting master event:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Master event not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete master event" },
      { status: 500 }
    );
  }
}

