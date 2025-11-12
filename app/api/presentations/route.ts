import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all presentations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    // Get user's church ID first
    let userChurchId: string | null = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { 
          campusId: true, 
          campus: { 
            select: { 
              churchId: true 
            } 
          } 
        },
      });
      userChurchId = user?.campus?.churchId || null;
    } catch (error) {
      console.error("Error fetching user church:", error);
    }

    const where: any = {};
    if (userChurchId) {
      where.churchId = userChurchId;
    }

    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
      
      if (userChurchId) {
        // If we have churchId, combine with AND
        where.AND = [
          { churchId: userChurchId },
          { OR: searchConditions },
        ];
        delete where.churchId; // Remove the direct churchId since it's in AND
      } else {
        where.OR = searchConditions;
      }
    }

    const presentations = await prisma.presentation.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        slides: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { slides: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ presentations });
  } catch (error: any) {
    console.error("Error fetching presentations:", error);
    return NextResponse.json(
      { error: "Failed to fetch presentations" },
      { status: 500 }
    );
  }
}

// POST - Create new presentation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, isPublic, initialSlides } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Get user's church - get from user's campus or find first active church
    let churchId: string;
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { 
          campusId: true, 
          campus: { 
            select: { 
              churchId: true 
            } 
          } 
        },
      });

      if (user?.campus?.churchId) {
        churchId = user.campus.churchId;
      } else {
        // Fallback: get first active church
        const church = await prisma.church.findFirst({
          where: { isActive: true },
          select: { id: true },
        });
        churchId = church?.id || "default-church-id";
      }
    } catch (error) {
      // If error, try to get first church
      try {
        const church = await prisma.church.findFirst({
          select: { id: true },
        });
        churchId = church?.id || "default-church-id";
      } catch {
        churchId = "default-church-id";
      }
    }

    // Create presentation with initial slides
    const presentation = await prisma.presentation.create({
      data: {
        title,
        description: description || null,
        isPublic: isPublic || false,
        presenterUserId: session.user.id,
        createdById: session.user.id,
        churchId,
        slides: {
          create: initialSlides || [
            {
              title: "Welcome Slide",
              content: "Edit this content for your presentation.",
              x: 100,
              y: 100,
              width: 320,
              height: 192,
              order: 0,
            },
          ],
        },
        currentSlideId: initialSlides?.[0]?.id || null,
      },
      include: {
        slides: {
          orderBy: { order: "asc" },
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

    // Set currentSlideId to first slide if slides were created
    if (presentation.slides.length > 0 && !presentation.currentSlideId) {
      await prisma.presentation.update({
        where: { id: presentation.id },
        data: { currentSlideId: presentation.slides[0].id },
      });
      presentation.currentSlideId = presentation.slides[0].id;
    }

    return NextResponse.json({ presentation }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating presentation:", error);
    return NextResponse.json(
      { error: "Failed to create presentation" },
      { status: 500 }
    );
  }
}

