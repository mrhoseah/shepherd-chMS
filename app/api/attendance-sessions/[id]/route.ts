import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single attendance session with full details
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

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        masterEvent: {
          include: {
            campus: {
              select: { id: true, name: true },
            },
            group: {
              select: { id: true, name: true },
            },
          },
        },
        attendees: {
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
          orderBy: { checkedInAt: "desc" },
        },
        decisions: {
          include: {
            proposedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { proposedAt: "desc" },
        },
        _count: {
          select: {
            attendees: true,
            decisions: true,
            donations: true,
          },
        },
      },
    });

    if (!attendanceSession) {
      return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
    }

    return NextResponse.json(attendanceSession);
  } catch (error: any) {
    console.error("Error fetching attendance session:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance session" },
      { status: 500 }
    );
  }
}

// PATCH - Update attendance session
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
      date,
      startTime,
      endTime,
      name,
      location,
      isJointService,
      isActive,
      isCancelled,
      cancelledReason,
      notes,
      metadata,
    } = body;

    const attendanceSession = await prisma.attendanceSession.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
        ...(name !== undefined && { name: name || null }),
        ...(location !== undefined && { location: location || null }),
        ...(isJointService !== undefined && { isJointService }),
        ...(isActive !== undefined && { isActive }),
        ...(isCancelled !== undefined && { isCancelled }),
        ...(cancelledReason !== undefined && { cancelledReason: cancelledReason || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(metadata !== undefined && { metadata }),
      },
      include: {
        masterEvent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(attendanceSession);
  } catch (error: any) {
    console.error("Error updating attendance session:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update attendance session" },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendance session
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

    await prisma.attendanceSession.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Attendance session deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting attendance session:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete attendance session" },
      { status: 500 }
    );
  }
}

