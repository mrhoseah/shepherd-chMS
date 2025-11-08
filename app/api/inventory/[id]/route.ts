import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single inventory item
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

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    );
  }
}

// PATCH - Update inventory item
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
    const {
      name,
      description,
      category,
      sku,
      quantity,
      unit,
      minQuantity,
      maxQuantity,
      unitCost,
      location,
      departmentId,
      supplier,
      notes,
      isActive,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (sku !== undefined) updateData.sku = sku || null;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (unit !== undefined) updateData.unit = unit || null;
    if (minQuantity !== undefined) updateData.minQuantity = minQuantity || null;
    if (maxQuantity !== undefined) updateData.maxQuantity = maxQuantity || null;
    if (unitCost !== undefined) updateData.unitCost = unitCost ? parseFloat(unitCost) : null;
    if (location !== undefined) updateData.location = location || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (supplier !== undefined) updateData.supplier = supplier || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error updating inventory item:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE - Delete inventory item
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

    // Check if item has transactions
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    if (item._count.transactions > 0) {
      // Soft delete by setting isActive to false
      await prisma.inventoryItem.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Inventory item deactivated (has transaction history)",
      });
    }

    // Hard delete if no transactions
    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Inventory item deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting inventory item:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}

