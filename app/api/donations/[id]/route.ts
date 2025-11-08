import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single donation
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

    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(donation);
  } catch (error) {
    console.error("Error fetching donation:", error);
    return NextResponse.json(
      { error: "Failed to fetch donation" },
      { status: 500 }
    );
  }
}

// PATCH - Update donation
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
    const updateData: any = { ...body };

    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }

    const donation = await prisma.donation.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(donation);
  } catch (error: any) {
    console.error("Error updating donation:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update donation" },
      { status: 500 }
    );
  }
}

// DELETE - Delete donation
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

    await prisma.donation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Donation deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting donation:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete donation" },
      { status: 500 }
    );
  }
}

