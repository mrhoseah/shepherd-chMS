import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all payslips
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const payrollId = searchParams.get("payrollId");
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};

    if (payrollId) {
      where.payrollId = payrollId;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (status) {
      where.status = status;
    }

    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
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
        take: limit,
        skip: offset,
      }),
      prisma.payslip.count({ where }),
    ]);

    return NextResponse.json({
      payslips,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching payslips:", error);
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    );
  }
}

// POST - Create payslip
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      payrollId,
      staffId,
      baseSalary,
      allowances,
      bonuses,
      deductions,
      payDate,
      notes,
      breakdown,
    } = body;

    if (!payrollId || !staffId || !baseSalary || !payDate) {
      return NextResponse.json(
        { error: "Payroll ID, staff ID, base salary, and pay date are required" },
        { status: 400 }
      );
    }

    // Calculate net pay
    const netPay =
      Number(baseSalary) +
      Number(allowances || 0) +
      Number(bonuses || 0) -
      Number(deductions || 0);

    const payslip = await prisma.payslip.create({
      data: {
        payrollId,
        staffId,
        baseSalary: parseFloat(baseSalary),
        allowances: parseFloat(allowances || 0),
        bonuses: parseFloat(bonuses || 0),
        deductions: parseFloat(deductions || 0),
        netPay,
        payDate: new Date(payDate),
        notes: notes || null,
        breakdown: breakdown || null,
        status: "PENDING",
        generatedById: session.user.id,
        generatedAt: new Date(),
      },
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

    return NextResponse.json(payslip, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payslip:", error);
    return NextResponse.json(
      { error: "Failed to create payslip" },
      { status: 500 }
    );
  }
}

