import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    );
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
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
      quantity = 0,
      unit,
      minQuantity,
      maxQuantity,
      unitCost,
      location,
      departmentId,
      supplier,
      notes,
      isActive = true,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        description: description || null,
        category,
        sku: sku || null,
        quantity,
        unit: unit || null,
        minQuantity: minQuantity || null,
        maxQuantity: maxQuantity || null,
        unitCost: unitCost ? parseFloat(unitCost) : null,
        location: location || null,
        departmentId: departmentId || null,
        supplier: supplier || null,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}

