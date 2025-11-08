import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single payroll with payslips
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

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        processedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        payslips: {
          include: {
            staff: {
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
            },
            generatedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { payDate: "desc" },
        },
      },
    });

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    return NextResponse.json(payroll);
  } catch (error: any) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}

// PUT - Update payroll (process, complete, etc.)
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
    const { status, notes } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (status === "COMPLETED") {
        updateData.processedAt = new Date();
        updateData.processedById = session.user.id;

        // Calculate total amount from payslips
        const payroll = await prisma.payroll.findUnique({
          where: { id },
          include: {
            payslips: {
              select: { netPay: true },
            },
          },
        });

        if (payroll) {
          const total = payroll.payslips.reduce(
            (sum, payslip) => sum + Number(payslip.netPay),
            0
          );
          updateData.totalAmount = total;
        }
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const payroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
      include: {
        processedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        payslips: {
          include: {
            staff: {
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
            },
          },
        },
      },
    });

    return NextResponse.json(payroll);
  } catch (error: any) {
    console.error("Error updating payroll:", error);
    return NextResponse.json(
      { error: "Failed to update payroll" },
      { status: 500 }
    );
  }
}

// DELETE - Delete payroll (only if draft)
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

    const payroll = await prisma.payroll.findUnique({ where: { id } });

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    if (payroll.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only delete draft payrolls" },
        { status: 400 }
      );
    }

    await prisma.payroll.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting payroll:", error);
    return NextResponse.json(
      { error: "Failed to delete payroll" },
      { status: 500 }
    );
  }
}

