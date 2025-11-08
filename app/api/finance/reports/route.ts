import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get financial reports
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const reportType = searchParams.get("type") || "summary"; // summary, donations, expenses, payroll, checks

    const churchId = (session.user as any).churchId || "default";
    const dateFilter: any = {};

    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    let report: any = {};

    switch (reportType) {
      case "summary": {
        // Overall financial summary
        const [donations, expenses, payrolls, checks] = await Promise.all([
          prisma.donation.aggregate({
            where: {
              status: "completed",
              createdAt: dateFilter,
            },
            _sum: { amount: true },
            _count: true,
          }),
          prisma.expense.aggregate({
            where: {
              status: "APPROVED",
              expenseDate: dateFilter,
            },
            _sum: { amount: true },
            _count: true,
          }),
          prisma.payroll.aggregate({
            where: {
              status: "COMPLETED",
              startDate: dateFilter,
              churchId,
            },
            _sum: { totalAmount: true },
            _count: true,
          }),
          prisma.check.aggregate({
            where: {
              status: { in: ["DEPOSITED", "CLEARED"] },
              receivedDate: dateFilter,
              churchId,
            },
            _sum: { amount: true },
            _count: true,
          }),
        ]);

        report = {
          totalIncome: Number(donations._sum.amount || 0),
          totalExpenses: Number(expenses._sum.amount || 0) + Number(payrolls._sum.totalAmount || 0),
          totalPayroll: Number(payrolls._sum.totalAmount || 0),
          totalChecks: Number(checks._sum.amount || 0),
          netIncome: Number(donations._sum.amount || 0) - (Number(expenses._sum.amount || 0) + Number(payrolls._sum.totalAmount || 0)),
          donationCount: donations._count,
          expenseCount: expenses._count,
          payrollCount: payrolls._count,
          checkCount: checks._count,
        };
        break;
      }

      case "donations": {
        const donations = await prisma.donation.findMany({
          where: {
            status: "completed",
            createdAt: dateFilter,
          },
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
          orderBy: { createdAt: "desc" },
        });

        // Group by category
        const byCategory = donations.reduce((acc: any, d) => {
          const cat = d.category;
          if (!acc[cat]) {
            acc[cat] = { total: 0, count: 0 };
          }
          acc[cat].total += Number(d.amount);
          acc[cat].count += 1;
          return acc;
        }, {});

        // Group by payment method
        const byMethod = donations.reduce((acc: any, d) => {
          const method = d.paymentMethod;
          if (!acc[method]) {
            acc[method] = { total: 0, count: 0 };
          }
          acc[method].total += Number(d.amount);
          acc[method].count += 1;
          return acc;
        }, {});

        report = {
          donations,
          byCategory,
          byMethod,
          total: donations.reduce((sum, d) => sum + Number(d.amount), 0),
          count: donations.length,
        };
        break;
      }

      case "expenses": {
        const expenses = await prisma.expense.findMany({
          where: {
            status: "APPROVED",
            expenseDate: dateFilter,
          },
          include: {
            submittedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { expenseDate: "desc" },
        });

        // Group by category
        const byCategory = expenses.reduce((acc: any, e) => {
          const cat = e.category;
          if (!acc[cat]) {
            acc[cat] = { total: 0, count: 0 };
          }
          acc[cat].total += Number(e.amount);
          acc[cat].count += 1;
          return acc;
        }, {});

        report = {
          expenses,
          byCategory,
          total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
          count: expenses.length,
        };
        break;
      }

      case "payroll": {
        const payrolls = await prisma.payroll.findMany({
          where: {
            status: "COMPLETED",
            startDate: dateFilter,
            churchId,
          },
          include: {
            payslips: {
              include: {
                staff: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { startDate: "desc" },
        });

        report = {
          payrolls,
          total: payrolls.reduce((sum, p) => sum + Number(p.totalAmount), 0),
          count: payrolls.length,
        };
        break;
      }

      case "checks": {
        const checks = await prisma.check.findMany({
          where: {
            receivedDate: dateFilter,
            churchId,
          },
          include: {
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { receivedDate: "desc" },
        });

        // Group by status
        const byStatus = checks.reduce((acc: any, c) => {
          const status = c.status;
          if (!acc[status]) {
            acc[status] = { total: 0, count: 0 };
          }
          acc[status].total += Number(c.amount);
          acc[status].count += 1;
          return acc;
        }, {});

        report = {
          checks,
          byStatus,
          total: checks.reduce((sum, c) => sum + Number(c.amount), 0),
          count: checks.length,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 }
    );
  }
}

