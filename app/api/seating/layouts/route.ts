import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all seating layouts for a church
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get("churchId");
    const layoutId = searchParams.get("layoutId");
    const includeItems = searchParams.get("includeItems") === "true";

    if (!churchId) {
      return NextResponse.json(
        { error: "churchId is required" },
        { status: 400 }
      );
    }

    // Fetch single layout with items
    if (layoutId) {
      const layout = await prisma.seatingLayout.findFirst({
        where: {
          id: layoutId,
          churchId,
        },
        include: {
          items: includeItems,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!layout) {
        return NextResponse.json(
          { error: "Layout not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ layout });
    }

    // Fetch all layouts for church
    const layouts = await prisma.seatingLayout.findMany({
      where: {
        churchId,
        isActive: true,
      },
      include: {
        _count: {
          select: { items: true },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { isDefault: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ layouts });
  } catch (error: any) {
    console.error("Error fetching seating layouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch layouts" },
      { status: 500 }
    );
  }
}

// POST - Create new seating layout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      churchId,
      name,
      description,
      canvasWidth = 1200,
      canvasHeight = 900,
      isDefault = false,
      items = [],
    } = body;

    if (!churchId || !name) {
      return NextResponse.json(
        { error: "churchId and name are required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.seatingLayout.updateMany({
        where: {
          churchId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Calculate total capacity
    const totalCapacity = items.reduce(
      (sum: number, item: any) => sum + (item.capacity || 0),
      0
    );

    // Create layout with items
    const layout = await prisma.seatingLayout.create({
      data: {
        churchId,
        name,
        description,
        canvasWidth,
        canvasHeight,
        isDefault,
        totalCapacity,
        createdById: session.user.id,
        items: {
          create: items.map((item: any) => ({
            type: item.type,
            label: item.label,
            x: item.x,
            y: item.y,
            rotation: item.rotation || 0,
            width: item.width,
            height: item.height,
            capacity: item.capacity || 0,
            color: item.color,
            metadata: item.metadata || {},
          })),
        },
      },
      include: {
        items: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ layout }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating seating layout:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A layout with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create layout" },
      { status: 500 }
    );
  }
}

// PUT - Update seating layout
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      layoutId,
      churchId,
      name,
      description,
      canvasWidth,
      canvasHeight,
      isDefault,
      isActive,
      items,
    } = body;

    if (!layoutId || !churchId) {
      return NextResponse.json(
        { error: "layoutId and churchId are required" },
        { status: 400 }
      );
    }

    // Verify layout exists and belongs to church
    const existingLayout = await prisma.seatingLayout.findFirst({
      where: {
        id: layoutId,
        churchId,
      },
    });

    if (!existingLayout) {
      return NextResponse.json(
        { error: "Layout not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.seatingLayout.updateMany({
        where: {
          churchId,
          isDefault: true,
          NOT: { id: layoutId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Calculate total capacity if items provided
    let totalCapacity = existingLayout.totalCapacity;
    if (items) {
      totalCapacity = items.reduce(
        (sum: number, item: any) => sum + (item.capacity || 0),
        0
      );

      // Delete existing items and create new ones
      await prisma.seatingItem.deleteMany({
        where: { layoutId },
      });
    }

    // Update layout
    const layout = await prisma.seatingLayout.update({
      where: { id: layoutId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(canvasWidth && { canvasWidth }),
        ...(canvasHeight && { canvasHeight }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
        totalCapacity,
        updatedById: session.user.id,
        ...(items && {
          items: {
            create: items.map((item: any) => ({
              type: item.type,
              label: item.label,
              x: item.x,
              y: item.y,
              rotation: item.rotation || 0,
              width: item.width,
              height: item.height,
              capacity: item.capacity || 0,
              color: item.color,
              metadata: item.metadata || {},
            })),
          },
        }),
      },
      include: {
        items: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ layout });
  } catch (error: any) {
    console.error("Error updating seating layout:", error);
    return NextResponse.json(
      { error: "Failed to update layout" },
      { status: 500 }
    );
  }
}

// DELETE - Delete seating layout
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layoutId");
    const churchId = searchParams.get("churchId");

    if (!layoutId || !churchId) {
      return NextResponse.json(
        { error: "layoutId and churchId are required" },
        { status: 400 }
      );
    }

    // Verify layout exists and belongs to church
    const layout = await prisma.seatingLayout.findFirst({
      where: {
        id: layoutId,
        churchId,
      },
    });

    if (!layout) {
      return NextResponse.json(
        { error: "Layout not found" },
        { status: 404 }
      );
    }

    // Delete layout (cascade will delete items)
    await prisma.seatingLayout.delete({
      where: { id: layoutId },
    });

    return NextResponse.json({ message: "Layout deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting seating layout:", error);
    return NextResponse.json(
      { error: "Failed to delete layout" },
      { status: 500 }
    );
  }
}
