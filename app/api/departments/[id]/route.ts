import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single department
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

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        inventoryItems: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            quantity: true,
            category: true,
          },
        },
        _count: {
          select: {
            staff: true,
            inventoryItems: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 }
    );
  }
}

// PATCH - Update department
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, leaderId, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (leaderId !== undefined) updateData.leaderId = leaderId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            staff: true,
            inventoryItems: true,
          },
        },
      },
    });

    return NextResponse.json(department);
  } catch (error: any) {
    console.error("Error updating department:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Department name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

// DELETE - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if department has staff or inventory items
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            staff: true,
            inventoryItems: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    if (department._count.staff > 0 || department._count.inventoryItems > 0) {
      // Soft delete by setting isActive to false
      await prisma.department.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Department deactivated (has staff or inventory items)",
      });
    }

    // Hard delete if no dependencies
    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting department:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}

