import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all visits for a guest
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

    const visits = await prisma.guestVisit.findMany({
      where: { guestId: id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { visitDate: "desc" },
    });

    return NextResponse.json({ visits });
  } catch (error: any) {
    console.error("Error fetching guest visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch guest visits" },
      { status: 500 }
    );
  }
}

// POST - Record a new guest visit
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
    const { visitDate, serviceType, eventId, notes } = body;

    const visit = await prisma.guestVisit.create({
      data: {
        guestId: id,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        serviceType: serviceType || null,
        eventId: eventId || null,
        notes: notes || null,
        recordedById: session.user.id,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error: any) {
    console.error("Error creating guest visit:", error);
    return NextResponse.json(
      { error: "Failed to record guest visit" },
      { status: 500 }
    );
  }
}

