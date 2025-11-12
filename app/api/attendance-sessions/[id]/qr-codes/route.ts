import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get QR codes for a specific attendance session
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

    // Verify session exists
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id },
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

    if (!attendanceSession) {
      return NextResponse.json(
        { error: "Attendance session not found" },
        { status: 404 }
      );
    }

    // Get QR codes for this session
    const qrCodes = await prisma.givingQRCode.findMany({
      where: {
        sessionId: id,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: attendanceSession.id,
        name: attendanceSession.name || attendanceSession.masterEvent.name,
        date: attendanceSession.date,
        masterEvent: attendanceSession.masterEvent,
      },
      qrCodes,
    });
  } catch (error: any) {
    console.error("Error fetching session QR codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch QR codes" },
      { status: 500 }
    );
  }
}

// POST - Manually generate QR codes for a session
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
    const { amount, category, paymentMethods, expiresInHours } = body;

    const { generateSessionQRCodes } = await import("@/lib/qr-session");
    const result = await generateSessionQRCodes(id, {
      amount,
      category,
      paymentMethods,
      expiresInHours,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error generating session QR codes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate QR codes" },
      { status: 500 }
    );
  }
}

