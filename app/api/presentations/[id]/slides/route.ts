import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all slides for a presentation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slides = await prisma.presentationSlide.findMany({
      where: { presentationId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ slides });
  } catch (error: any) {
    console.error("Error fetching slides:", error);
    return NextResponse.json(
      { error: "Failed to fetch slides" },
      { status: 500 }
    );
  }
}

// POST - Create new slide
export async function POST(
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
      title,
      content,
      x,
      y,
      width,
      height,
      order,
      backgroundColor,
      textColor,
      metadata,
    } = body;

    // Get max order if not provided
    let slideOrder = order;
    if (slideOrder === undefined) {
      const maxOrder = await prisma.presentationSlide.findFirst({
        where: { presentationId: id },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      slideOrder = (maxOrder?.order ?? -1) + 1;
    }

    const slide = await prisma.presentationSlide.create({
      data: {
        presentationId: id,
        title: title || "New Slide",
        content: content || null,
        x: x ?? Math.floor(Math.random() * 800) + 100,
        y: y ?? Math.floor(Math.random() * 800) + 100,
        width: width ?? 320,
        height: height ?? 192,
        order: slideOrder,
        backgroundColor: backgroundColor || null,
        textColor: textColor || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating slide:", error);
    return NextResponse.json(
      { error: "Failed to create slide" },
      { status: 500 }
    );
  }
}

