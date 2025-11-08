import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all follow-ups for a guest
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const followUps = await prisma.guestFollowUp.findMany({
      where: { guestId: id },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ followUps });
  } catch (error: any) {
    console.error("Error fetching guest follow-ups:", error);
    return NextResponse.json(
      { error: "Failed to fetch guest follow-ups" },
      { status: 500 }
    );
  }
}

// POST - Create a new follow-up
export async function POST(
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
      type,
      method,
      subject,
      content,
      scheduledAt,
      assignedToId,
      notes,
      metadata,
    } = body;

    if (!type || !method || !content) {
      return NextResponse.json(
        { error: "Type, method, and content are required" },
        { status: 400 }
      );
    }

    // Check if guest has follow-ups enabled
    const guest = await prisma.user.findUnique({
      where: { id },
      select: { enableFollowUps: true, role: true },
    });

    if (!guest || guest.role !== "GUEST") {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    if (!guest.enableFollowUps) {
      return NextResponse.json(
        { error: "Follow-up tracking is disabled for this guest" },
        { status: 400 }
      );
    }

    const followUp = await prisma.guestFollowUp.create({
      data: {
        guestId: id,
        type,
        method,
        subject: subject || null,
        content,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        assignedToId: assignedToId || null,
        notes: notes || null,
        metadata: metadata || null,
        createdById: session.user.id,
        status: scheduledAt ? "SCHEDULED" : "PENDING",
      },
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

    return NextResponse.json(followUp, { status: 201 });
  } catch (error: any) {
    console.error("Error creating follow-up:", error);
    return NextResponse.json(
      { error: "Failed to create follow-up" },
      { status: 500 }
    );
  }
}

