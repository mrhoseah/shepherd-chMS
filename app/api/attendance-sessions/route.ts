import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSessionQRCodes } from "@/lib/qr-session";

// GET - List all attendance sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const masterEventId = searchParams.get("masterEventId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isJointService = searchParams.get("isJointService");
    const isActive = searchParams.get("isActive");

    const where: any = {};

    if (masterEventId) where.masterEventId = masterEventId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (isJointService !== null) where.isJointService = isJointService === "true";
    if (isActive !== null) where.isActive = isActive === "true";

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        masterEvent: {
          select: {
            id: true,
            name: true,
            type: true,
            campus: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            attendees: true,
            decisions: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Error fetching attendance sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance sessions" },
      { status: 500 }
    );
  }
}

// POST - Create new attendance session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      masterEventId,
      date,
      startTime,
      endTime,
      name,
      location,
      isJointService,
      isActive,
      notes,
      metadata,
    } = body;

    if (!masterEventId || !date || !startTime) {
      return NextResponse.json(
        { error: "masterEventId, date, and startTime are required" },
        { status: 400 }
      );
    }

    // Verify master event exists
    const masterEvent = await prisma.masterEvent.findUnique({
      where: { id: masterEventId },
    });

    if (!masterEvent) {
      return NextResponse.json(
        { error: "Master event not found" },
        { status: 404 }
      );
    }

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        masterEventId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        name: name || null,
        location: location || null,
        isJointService: isJointService || false,
        isActive: isActive !== undefined ? isActive : true,
        notes: notes || null,
        metadata: metadata || null,
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

    // Automatically generate QR codes for this session (for giving)
    // This allows people to give and link their donation to this specific session
    // Run this asynchronously so it doesn't block session creation
    const autoGenerateQR = body.autoGenerateQR !== false; // Default to true unless explicitly disabled
    if (autoGenerateQR) {
      // Generate QR codes in the background (don't wait for it to complete)
      // Use Promise.resolve().then() to ensure it runs after the response is sent
      Promise.resolve().then(async () => {
        try {
          await generateSessionQRCodes(attendanceSession.id, {
            amount: null, // Any amount
            category: "OFFERING",
            paymentMethods: ["MPESA", "PAYPAL"],
            expiresInHours: 24,
          });
          console.log(`✅ QR codes generated for session ${attendanceSession.id}`);
        } catch (error: any) {
          console.error("Error auto-generating QR codes for session:", error);
          // Don't fail the session creation if QR generation fails
        }
      }).catch((error) => {
        // Catch any errors in the promise chain itself
        console.error("Error in QR code generation promise:", error);
      });
    }

    return NextResponse.json(attendanceSession, { status: 201 });
  } catch (error: any) {
    console.error("Error creating attendance session:", error);
    return NextResponse.json(
      { error: "Failed to create attendance session" },
      { status: 500 }
    );
  }
}

