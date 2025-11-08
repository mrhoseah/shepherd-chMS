import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all payrolls
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      churchId: (session.user as any).churchId || "default",
    };

    if (status) {
      where.status = status;
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
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
          _count: {
            select: { payslips: true },
          },
        },
        orderBy: { startDate: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.payroll.count({ where }),
    ]);

    return NextResponse.json({
      payrolls,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching payrolls:", error);
    return NextResponse.json(
      { error: "Failed to fetch payrolls" },
      { status: 500 }
    );
  }
}

// POST - Create new payroll
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
    const { payPeriod, startDate, endDate, notes } = body;

    if (!payPeriod || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Pay period, start date, and end date are required" },
        { status: 400 }
      );
    }

    const churchId = (session.user as any).churchId || "default";

    // Check if payroll for this period already exists
    const existing = await prisma.payroll.findUnique({
      where: {
        churchId_payPeriod: {
          churchId,
          payPeriod,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Payroll for this period already exists" },
        { status: 409 }
      );
    }

    const payroll = await prisma.payroll.create({
      data: {
        payPeriod,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes: notes || null,
        churchId,
        status: "DRAFT",
      },
      include: {
        processedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { payslips: true },
        },
      },
    });

    return NextResponse.json(payroll, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payroll:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Payroll for this period already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create payroll" },
      { status: 500 }
    );
  }
}

