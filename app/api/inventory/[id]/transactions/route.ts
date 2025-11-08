import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get transactions for an item
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

    const transactions = await prisma.inventoryTransaction.findMany({
      where: { itemId: id },
      include: {
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Create transaction (restock, usage, adjustment)
export async function POST(
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
    const { type, quantity, reason, notes } = body;

    if (!type || !["IN", "OUT", "ADJUSTMENT"].includes(type)) {
      return NextResponse.json(
        { error: "Valid transaction type is required (IN, OUT, or ADJUSTMENT)" },
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    // Get current item
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Calculate new quantity
    let newQuantity = item.quantity;
    if (type === "IN") {
      newQuantity += quantity;
    } else if (type === "OUT") {
      newQuantity -= quantity;
      if (newQuantity < 0) {
        return NextResponse.json(
          { error: "Insufficient quantity in stock" },
          { status: 400 }
        );
      }
    } else if (type === "ADJUSTMENT") {
      newQuantity = quantity;
    }

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { id: true },
    });

    // Create transaction and update item in a transaction
    const result = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          itemId: id,
          type,
          quantity: parseInt(quantity),
          reason: reason || null,
          performedById: user?.id || null,
          notes: notes || null,
        },
      }),
      prisma.inventoryItem.update({
        where: { id },
        data: {
          quantity: newQuantity,
          lastRestocked: type === "IN" ? new Date() : item.lastRestocked,
        },
      }),
    ]);

    return NextResponse.json({
      transaction: result[0],
      item: result[1],
    });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}

