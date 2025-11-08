import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single check
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const check = await prisma.check.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        depositedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        donation: {
          select: {
            id: true,
            amount: true,
            category: true,
            status: true,
          },
        },
      },
    });

    if (!check) {
      return NextResponse.json({ error: "Check not found" }, { status: 404 });
    }

    return NextResponse.json(check);
  } catch (error: any) {
    console.error("Error fetching check:", error);
    return NextResponse.json(
      { error: "Failed to fetch check" },
      { status: 500 }
    );
  }
}

// PUT - Update check (deposit, clear, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has finance permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "FINANCE" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, depositedDate, clearedDate } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      // Update dates based on status
      if (status === "DEPOSITED" && !depositedDate) {
        updateData.depositedDate = new Date();
        updateData.depositedById = session.user.id;
      } else if (status === "CLEARED" && !clearedDate) {
        updateData.clearedDate = new Date();
        // If not already deposited, mark as deposited first
        const check = await prisma.check.findUnique({ where: { id } });
        if (check && check.status !== "DEPOSITED") {
          updateData.depositedDate = new Date();
          updateData.depositedById = session.user.id;
        }
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (depositedDate) {
      updateData.depositedDate = new Date(depositedDate);
      updateData.depositedById = session.user.id;
    }

    if (clearedDate) {
      updateData.clearedDate = new Date(clearedDate);
    }

    const check = await prisma.check.update({
      where: { id },
      data: updateData,
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        depositedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        donation: {
          select: {
            id: true,
            amount: true,
            category: true,
            status: true,
          },
        },
      },
    });

    // Update donation status if check is cleared
    if (status === "CLEARED" && check.donationId) {
      await prisma.donation.update({
        where: { id: check.donationId },
        data: { status: "completed" },
      });
    } else if (status === "BOUNCED" && check.donationId) {
      await prisma.donation.update({
        where: { id: check.donationId },
        data: { status: "failed" },
      });
    }

    return NextResponse.json(check);
  } catch (error: any) {
    console.error("Error updating check:", error);
    return NextResponse.json(
      { error: "Failed to update check" },
      { status: 500 }
    );
  }
}

// DELETE - Delete check (only if pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has finance permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "FINANCE" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const check = await prisma.check.findUnique({ where: { id } });

    if (!check) {
      return NextResponse.json({ error: "Check not found" }, { status: 404 });
    }

    if (check.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only delete pending checks" },
        { status: 400 }
      );
    }

    await prisma.check.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting check:", error);
    return NextResponse.json(
      { error: "Failed to delete check" },
      { status: 500 }
    );
  }
}

