import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";

// GET - Get financial reports (P&L, Balance Sheet, Cash Flow)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "FINANCE" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "profit-loss";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "month"; // month, quarter, year

    let dateFilter: { gte: Date; lte: Date } | undefined;

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      const now = new Date();
      switch (period) {
        case "month":
          dateFilter = {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          };
          break;
        case "quarter":
          dateFilter = {
            gte: startOfMonth(subMonths(now, 2)),
            lte: endOfMonth(now),
          };
          break;
        case "year":
          dateFilter = {
            gte: startOfYear(now),
            lte: endOfYear(now),
          };
          break;
        default:
          dateFilter = {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          };
      }
    }

    switch (reportType) {
      case "profit-loss": {
        // Income (Donations)
        const donations = await prisma.donation.findMany({
          where: {
            status: "completed",
            createdAt: dateFilter,
          },
          select: {
            amount: true,
            category: true,
            createdAt: true,
          },
        });

        const incomeByCategory = donations.reduce((acc, donation) => {
          const category = donation.category;
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += Number(donation.amount);
          return acc;
        }, {} as Record<string, number>);

        const totalIncome = donations.reduce((sum, d) => sum + Number(d.amount), 0);

        // Expenses
        const expenses = await prisma.expense.findMany({
          where: {
            status: "PAID",
            expenseDate: dateFilter,
          },
          select: {
            amount: true,
            category: true,
            expenseDate: true,
          },
        });

        const expensesByCategory = expenses.reduce((acc, expense) => {
          const category = expense.category;
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += Number(expense.amount);
          return acc;
        }, {} as Record<string, number>);

        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Net Income
        const netIncome = totalIncome - totalExpenses;

        return NextResponse.json({
          reportType: "profit-loss",
          period: {
            start: dateFilter.gte,
            end: dateFilter.lte,
          },
          income: {
            total: totalIncome,
            byCategory: incomeByCategory,
            breakdown: Object.entries(incomeByCategory).map(([category, amount]) => ({
              category,
              amount,
              percentage: (amount / totalIncome) * 100,
            })),
          },
          expenses: {
            total: totalExpenses,
            byCategory: expensesByCategory,
            breakdown: Object.entries(expensesByCategory).map(([category, amount]) => ({
              category,
              amount,
              percentage: (amount / totalExpenses) * 100,
            })),
          },
          netIncome,
          margin: totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0,
        });
      }

      case "balance-sheet": {
        // Assets
        const accounts = await prisma.account.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            type: true,
            balance: true,
          },
        });

        const assets = accounts
          .filter((a) => a.type === "asset")
          .reduce((sum, a) => sum + Number(a.balance), 0);

        const liabilities = accounts
          .filter((a) => a.type === "liability")
          .reduce((sum, a) => sum + Number(a.balance), 0);

        const equity = accounts
          .filter((a) => a.type === "equity")
          .reduce((sum, a) => sum + Number(a.balance), 0);

        // Calculate retained earnings (Income - Expenses)
        const donations = await prisma.donation.findMany({
          where: {
            status: "completed",
            createdAt: dateFilter,
          },
        });

        const expenses = await prisma.expense.findMany({
          where: {
            status: "PAID",
            expenseDate: dateFilter,
          },
        });

        const totalIncome = donations.reduce((sum, d) => sum + Number(d.amount), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const retainedEarnings = totalIncome - totalExpenses;

        return NextResponse.json({
          reportType: "balance-sheet",
          asOf: dateFilter.lte,
          assets: {
            total: assets,
            breakdown: accounts
              .filter((a) => a.type === "asset")
              .map((a) => ({
                name: a.name,
                balance: Number(a.balance),
              })),
          },
          liabilities: {
            total: liabilities,
            breakdown: accounts
              .filter((a) => a.type === "liability")
              .map((a) => ({
                name: a.name,
                balance: Number(a.balance),
              })),
          },
          equity: {
            total: equity + retainedEarnings,
            breakdown: [
              ...accounts
                .filter((a) => a.type === "equity")
                .map((a) => ({
                  name: a.name,
                  balance: Number(a.balance),
                })),
              {
                name: "Retained Earnings",
                balance: retainedEarnings,
              },
            ],
          },
          totalLiabilitiesAndEquity: liabilities + equity + retainedEarnings,
        });
      }

      case "cash-flow": {
        // Operating Activities
        const donations = await prisma.donation.findMany({
          where: {
            status: "completed",
            createdAt: dateFilter,
          },
          select: {
            amount: true,
            paymentMethod: true,
            createdAt: true,
          },
        });

        const expenses = await prisma.expense.findMany({
          where: {
            status: "PAID",
            expenseDate: dateFilter,
          },
          select: {
            amount: true,
            expenseDate: true,
          },
        });

        const cashFromOperations = donations.reduce((sum, d) => sum + Number(d.amount), 0);
        const cashUsedInOperations = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const netCashFromOperations = cashFromOperations - cashUsedInOperations;

        // Investing Activities (placeholder - would need asset transactions)
        const netCashFromInvesting = 0;

        // Financing Activities (placeholder - would need loan transactions)
        const netCashFromFinancing = 0;

        const netChangeInCash = netCashFromOperations + netCashFromInvesting + netCashFromFinancing;

        // Get beginning cash balance (from previous period)
        const previousPeriodEnd = new Date(dateFilter.gte);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);

        const cashAccounts = await prisma.account.findMany({
          where: {
            type: "asset",
            name: { contains: "cash", mode: "insensitive" },
          },
        });

        // This is simplified - in reality, you'd calculate from transactions
        const beginningCash = cashAccounts.reduce(
          (sum, acc) => sum + Number(acc.balance),
          0
        ) - netChangeInCash;

        const endingCash = beginningCash + netChangeInCash;

        return NextResponse.json({
          reportType: "cash-flow",
          period: {
            start: dateFilter.gte,
            end: dateFilter.lte,
          },
          operatingActivities: {
            cashReceived: cashFromOperations,
            cashPaid: cashUsedInOperations,
            netCash: netCashFromOperations,
          },
          investingActivities: {
            netCash: netCashFromInvesting,
          },
          financingActivities: {
            netCash: netCashFromFinancing,
          },
          netChangeInCash,
          beginningCash,
          endingCash,
        });
      }

      case "giving-summary": {
        const donations = await prisma.donation.findMany({
          where: {
            status: "completed",
            createdAt: dateFilter,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        const totalGiving = donations.reduce((sum, d) => sum + Number(d.amount), 0);
        const averageDonation = donations.length > 0 ? totalGiving / donations.length : 0;

        const givingByCategory = donations.reduce((acc, donation) => {
          const category = donation.category;
          if (!acc[category]) {
            acc[category] = { total: 0, count: 0 };
          }
          acc[category].total += Number(donation.amount);
          acc[category].count += 1;
          return acc;
        }, {} as Record<string, { total: number; count: number }>);

        const givingByMethod = donations.reduce((acc, donation) => {
          const method = donation.paymentMethod;
          if (!acc[method]) {
            acc[method] = { total: 0, count: 0 };
          }
          acc[method].total += Number(donation.amount);
          acc[method].count += 1;
          return acc;
        }, {} as Record<string, { total: number; count: number }>);

        // Monthly breakdown
        const monthlyBreakdown = donations.reduce((acc, donation) => {
          const month = new Date(donation.createdAt).toLocaleString("default", {
            month: "short",
            year: "numeric",
          });
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += Number(donation.amount);
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          reportType: "giving-summary",
          period: {
            start: dateFilter.gte,
            end: dateFilter.lte,
          },
          summary: {
            totalGiving,
            totalDonations: donations.length,
            averageDonation,
            uniqueDonors: new Set(donations.map((d) => d.userId).filter(Boolean)).size,
          },
          byCategory: Object.entries(givingByCategory).map(([category, data]) => ({
            category,
            total: data.total,
            count: data.count,
            percentage: (data.total / totalGiving) * 100,
          })),
          byMethod: Object.entries(givingByMethod).map(([method, data]) => ({
            method,
            total: data.total,
            count: data.count,
            percentage: (data.total / totalGiving) * 100,
          })),
          monthlyBreakdown: Object.entries(monthlyBreakdown).map(([month, amount]) => ({
            month,
            amount,
          })),
          topDonors: Object.values(
            donations
              .filter((d) => d.userId)
              .reduce((acc, donation) => {
                const userId = donation.userId!;
                if (!acc[userId]) {
                  acc[userId] = {
                    user: donation.user,
                    total: 0,
                    count: 0,
                  };
                }
                acc[userId].total += Number(donation.amount);
                acc[userId].count += 1;
                return acc;
              }, {} as Record<string, { user: any; total: number; count: number }>)
          )
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
            .map((item) => ({
              name: `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim(),
              email: item.user?.email,
              total: item.total,
              count: item.count,
            })),
        });
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

