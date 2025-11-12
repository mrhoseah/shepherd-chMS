import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateFundCode } from "@/lib/services/paybill-parser";

// GET - Get single fund category
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

    const fundCategory = await prisma.fundCategory.findUnique({
      where: { id },
    });

    if (!fundCategory) {
      return NextResponse.json({ error: "Fund category not found" }, { status: 404 });
    }

    return NextResponse.json(fundCategory);
  } catch (error: any) {
    console.error("Error fetching fund category:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund category" },
      { status: 500 }
    );
  }
}

// PATCH - Update fund category
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

    // Only admins and pastors can update
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "PASTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, description, isActive } = body;

    // Validate code if being updated
    if (code !== undefined) {
      const validation = validateFundCode(code);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Check if code is already used by another category
      const existing = await prisma.fundCategory.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "Fund code already in use" },
          { status: 409 }
        );
      }
    }

    const fundCategory = await prisma.fundCategory.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: code.toUpperCase().trim() }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(fundCategory);
  } catch (error: any) {
    console.error("Error updating fund category:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Fund category not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Fund code already in use" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update fund category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete fund category
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

    // Only admins can delete
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if category has donations
    const donationCount = await prisma.donation.count({
      where: { fundCategoryId: id },
    });

    if (donationCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete fund category with existing donations. Deactivate it instead." },
        { status: 400 }
      );
    }

    await prisma.fundCategory.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Fund category deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting fund category:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Fund category not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete fund category" },
      { status: 500 }
    );
  }
}

