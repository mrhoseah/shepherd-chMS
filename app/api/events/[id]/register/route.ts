import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Register for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { userId, name, ministry, country, phone, email, needsAccommodation, notes } = body;

    // Get event to check if registration is required and capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if event requires registration
    if (!event.requiresRegistration) {
      return NextResponse.json(
        { error: "This event does not require registration" },
        { status: 400 }
      );
    }

    // Check capacity if set
    if (event.capacity && event._count.registrations >= event.capacity) {
      return NextResponse.json(
        { error: "Event is at full capacity" },
        { status: 400 }
      );
    }

    // If userId is provided, use it; otherwise require name and contact info
    if (userId) {
      // Check if already registered
      const existing = await prisma.eventRegistration.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "You are already registered for this event" },
          { status: 409 }
        );
      }

      // Register logged-in user
      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          userId,
          needsAccommodation: needsAccommodation || false,
          status: "registered",
          notes,
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
      });

      return NextResponse.json(registration, { status: 201 });
    } else {
      // Non-user registration - require name and at least one contact method
      if (!name) {
        return NextResponse.json(
          { error: "Name is required for registration" },
          { status: 400 }
        );
      }

      if (!email && !phone) {
        return NextResponse.json(
          { error: "Please provide either an email or phone number" },
          { status: 400 }
        );
      }

      // Check if already registered by email or phone
      if (email) {
        const existingByEmail = await prisma.eventRegistration.findFirst({
          where: {
            eventId,
            email,
          },
        });

        if (existingByEmail) {
          return NextResponse.json(
            { error: "This email is already registered for this event" },
            { status: 409 }
          );
        }
      }

      if (phone) {
        const existingByPhone = await prisma.eventRegistration.findFirst({
          where: {
            eventId,
            phone,
          },
        });

        if (existingByPhone) {
          return NextResponse.json(
            { error: "This phone number is already registered for this event" },
            { status: 409 }
          );
        }
      }

      // Create non-user registration
      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          name,
          ministry,
          country,
          phone,
          email,
          needsAccommodation: needsAccommodation || false,
          status: "registered",
          notes,
        },
      });

      return NextResponse.json(registration, { status: 201 });
    }
  } catch (error: any) {
    console.error("Error registering for event:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}

// GET - Get registrations for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
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
      orderBy: { registeredAt: "desc" },
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

