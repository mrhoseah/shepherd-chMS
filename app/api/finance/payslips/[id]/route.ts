import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single payslip
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

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        payroll: {
          select: {
            id: true,
            payPeriod: true,
            startDate: true,
            endDate: true,
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
              },
            },
            department: {
              select: {
                id: true,
                name: true,
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
    });

    if (!payslip) {
      return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
    }

    return NextResponse.json(payslip);
  } catch (error: any) {
    console.error("Error fetching payslip:", error);
    return NextResponse.json(
      { error: "Failed to fetch payslip" },
      { status: 500 }
    );
  }
}

// PUT - Update payslip
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
    const {
      baseSalary,
      allowances,
      bonuses,
      deductions,
      status,
      payslipUrl,
      notes,
      breakdown,
    } = body;

    const updateData: any = {};

    if (baseSalary !== undefined) {
      updateData.baseSalary = parseFloat(baseSalary);
    }

    if (allowances !== undefined) {
      updateData.allowances = parseFloat(allowances);
    }

    if (bonuses !== undefined) {
      updateData.bonuses = parseFloat(bonuses);
    }

    if (deductions !== undefined) {
      updateData.deductions = parseFloat(deductions);
    }

    if (status) {
      updateData.status = status;

      if (status === "SENT" && !updateData.sentAt) {
        updateData.sentAt = new Date();
      }
    }

    if (payslipUrl !== undefined) {
      updateData.payslipUrl = payslipUrl;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (breakdown !== undefined) {
      updateData.breakdown = breakdown;
    }

    // Recalculate net pay if any amount fields changed
    if (
      baseSalary !== undefined ||
      allowances !== undefined ||
      bonuses !== undefined ||
      deductions !== undefined
    ) {
      const payslip = await prisma.payslip.findUnique({ where: { id } });
      if (payslip) {
        const netPay =
          Number(updateData.baseSalary ?? payslip.baseSalary) +
          Number(updateData.allowances ?? payslip.allowances) +
          Number(updateData.bonuses ?? payslip.bonuses) -
          Number(updateData.deductions ?? payslip.deductions);
        updateData.netPay = netPay;
      }
    }

    const payslip = await prisma.payslip.update({
      where: { id },
      data: updateData,
      include: {
        payroll: {
          select: {
            id: true,
            payPeriod: true,
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
    });

    // Update payroll total
    const payroll = await prisma.payroll.findUnique({
      where: { id: payslip.payrollId },
      include: {
        payslips: {
          select: { netPay: true },
        },
      },
    });

    if (payroll) {
      const total = payroll.payslips.reduce(
        (sum, p) => sum + Number(p.netPay),
        0
      );
      await prisma.payroll.update({
        where: { id: payslip.payrollId },
        data: { totalAmount: total },
      });
    }

    return NextResponse.json(payslip);
  } catch (error: any) {
    console.error("Error updating payslip:", error);
    return NextResponse.json(
      { error: "Failed to update payslip" },
      { status: 500 }
    );
  }
}

// DELETE - Delete payslip (only if pending)
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

    const payslip = await prisma.payslip.findUnique({ where: { id } });

    if (!payslip) {
      return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
    }

    if (payslip.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only delete pending payslips" },
        { status: 400 }
      );
    }

    const payrollId = payslip.payrollId;

    await prisma.payslip.delete({ where: { id } });

    // Update payroll total
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        payslips: {
          select: { netPay: true },
        },
      },
    });

    if (payroll) {
      const total = payroll.payslips.reduce(
        (sum, p) => sum + Number(p.netPay),
        0
      );
      await prisma.payroll.update({
        where: { id: payrollId },
        data: { totalAmount: total },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting payslip:", error);
    return NextResponse.json(
      { error: "Failed to delete payslip" },
      { status: 500 }
    );
  }
}

