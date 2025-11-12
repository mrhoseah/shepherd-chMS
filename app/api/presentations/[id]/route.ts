import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single presentation with real-time state (supports public viewing)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { order: "asc" },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    // If presentation is not public, require authentication
    if (!presentation.isPublic) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Optional: Check if user has access (same church, creator, etc.)
    }

    return NextResponse.json({ presentation });
  } catch (error: any) {
    console.error("Error fetching presentation:", error);
    return NextResponse.json(
      { error: "Failed to fetch presentation" },
      { status: 500 }
    );
  }
}

// PATCH - Update presentation (current slide, presenter, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    // Check if presentation exists and get its current state
    const existingPresentation = await prisma.presentation.findUnique({
      where: { id },
      select: { isPublic: true, createdById: true },
    });

    if (!existingPresentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { currentSlideId, presenterUserId, title, description, isPublic, showSlideRing, viewerSize, backgroundType, isPresenting, viewerCountdown, viewerAnimation } = body;

    // For public presentations, allow anyone to update currentSlideId (for real-time viewing)
    // But require auth for other updates
    if (!existingPresentation.isPublic && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow creator to update title, description, isPublic
    if (title !== undefined || description !== undefined || isPublic !== undefined) {
      if (!session?.user?.id || session.user.id !== existingPresentation.createdById) {
        return NextResponse.json(
          { error: "Only the creator can update presentation settings" },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (currentSlideId !== undefined) updateData.currentSlideId = currentSlideId;
    if (presenterUserId !== undefined) updateData.presenterUserId = presenterUserId;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    
    // Viewer settings - only creator can update
    if (showSlideRing !== undefined || viewerSize !== undefined || backgroundType !== undefined || viewerCountdown !== undefined || viewerAnimation !== undefined) {
      if (!session?.user?.id || session.user.id !== existingPresentation.createdById) {
        return NextResponse.json(
          { error: "Only the creator can update viewer settings" },
          { status: 403 }
        );
      }
      if (showSlideRing !== undefined) updateData.showSlideRing = showSlideRing;
      if (viewerSize !== undefined) updateData.viewerSize = viewerSize;
      if (backgroundType !== undefined) updateData.backgroundType = backgroundType;
      if (viewerCountdown !== undefined) updateData.viewerCountdown = viewerCountdown;
      if (viewerAnimation !== undefined) updateData.viewerAnimation = viewerAnimation;
    }
    
    // Allow presenter to update isPresenting status
    if (isPresenting !== undefined && session?.user?.id) {
      // Check if user is the creator or assigned presenter
      const isCreator = session.user.id === existingPresentation.createdById;
      const isAssignedPresenter = existingPresentation.presenterUserId === session.user.id;
      if (isCreator || isAssignedPresenter) {
        updateData.isPresenting = isPresenting;
      }
    }

    const presentation = await prisma.presentation.update({
      where: { id },
      data: updateData,
      include: {
        slides: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ presentation });
  } catch (error: any) {
    console.error("Error updating presentation:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }
    // Provide more detailed error message
    const errorMessage = error.message || "Failed to update presentation";
    return NextResponse.json(
      { error: errorMessage, details: error.code || "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete presentation
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

    await prisma.presentation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Presentation deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting presentation:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete presentation" },
      { status: 500 }
    );
  }
}

