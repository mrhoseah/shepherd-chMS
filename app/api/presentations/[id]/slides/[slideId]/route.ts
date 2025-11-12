import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Update slide
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slideId: string }> }
) {
  const { id, slideId } = await params;
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

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (x !== undefined) updateData.x = x;
    if (y !== undefined) updateData.y = y;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (order !== undefined) updateData.order = order;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (metadata !== undefined) updateData.metadata = metadata;

    const slide = await prisma.presentationSlide.update({
      where: { id: slideId },
      data: updateData,
    });

    return NextResponse.json({ slide });
  } catch (error: any) {
    console.error("Error updating slide:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update slide" },
      { status: 500 }
    );
  }
}

// DELETE - Delete slide
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slideId: string }> }
) {
  const { id, slideId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.presentationSlide.delete({
      where: { id: slideId },
    });

    return NextResponse.json({ message: "Slide deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting slide:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete slide" },
      { status: 500 }
    );
  }
}

