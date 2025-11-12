import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateFollowUpContent } from "@/lib/ai/communication";
import { prisma } from "@/lib/prisma";

// POST - Generate AI follow-up content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { guestId, type, method, context, tone, length } = body;

    if (!guestId || !type || !method) {
      return NextResponse.json(
        { error: "Guest ID, type, and method are required" },
        { status: 400 }
      );
    }

    // Fetch guest information
    const guest = await prisma.user.findUnique({
      where: { id: guestId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        country: true,
      },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const guestName = [guest.firstName, guest.lastName].filter(Boolean).join(" ");

    // Get previous follow-ups count
    const previousFollowUpsCount = await prisma.guestFollowUp.count({
      where: { guestId },
    });

    // Generate content
    const generated = await generateFollowUpContent({
      guestName,
      guestFirstName: guest.firstName,
      guestLastName: guest.lastName,
      type,
      method,
      context: {
        ...context,
        previousFollowUps: previousFollowUpsCount,
      },
      tone,
      length,
    });

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error("Error generating AI follow-up:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate follow-up content" },
      { status: 500 }
    );
  }
}

