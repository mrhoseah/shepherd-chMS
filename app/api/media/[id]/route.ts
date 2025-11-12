import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single media item
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

    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.media.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(media);
  } catch (error: any) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// PATCH - Update media
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
      title,
      description,
      type,
      category,
      series,
      speaker,
      url,
      thumbnailUrl,
      duration,
      tags,
      isPublic,
    } = body;

    const media = await prisma.media.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(type && { type }),
        ...(category !== undefined && { category: category || null }),
        ...(series !== undefined && { series: series || null }),
        ...(speaker !== undefined && { speaker: speaker || null }),
        ...(url && { url }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || null }),
        ...(duration !== undefined && { duration: duration || null }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(media);
  } catch (error: any) {
    console.error("Error updating media:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE - Delete media
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

    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Media deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting media:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}

