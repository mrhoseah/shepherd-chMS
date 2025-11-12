import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "year";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0);
    }

    // Get donations
    const donations = await prisma.donation.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "completed",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const totalRevenue = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const averageDonation = donations.length > 0 ? totalRevenue / donations.length : 0;

    // Previous period for comparison
    const periodDuration = now.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodDuration);
    const previousDonations = await prisma.donation.findMany({
      where: {
        createdAt: {
          gte: previousStart,
          lt: startDate,
        },
        status: "completed",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    const previousRevenue = previousDonations.reduce((sum, d) => sum + Number(d.amount), 0);
    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Projected revenue (simple linear projection)
    const projectedRevenue = totalRevenue * (1 + revenueGrowth / 100);

    // Donor retention
    const uniqueDonors = new Set(donations.map((d) => d.userId).filter(Boolean));
    const previousUniqueDonors = new Set(previousDonations.map((d) => d.userId).filter(Boolean));
    const returningDonors = Array.from(uniqueDonors).filter((id) =>
      previousUniqueDonors.has(id)
    ).length;
    const donorRetention = previousUniqueDonors.size > 0
      ? (returningDonors / previousUniqueDonors.size) * 100
      : 0;

    // Revenue trends - group by month
    const revenueTrends = [];
    const periods = range === "year" ? 12 : range === "quarter" ? 3 : range === "month" ? 1 : 12;
    
    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = new Date(now);
      const periodEnd = new Date(now);
      
      if (range === "year" || range === "all") {
        periodStart.setMonth(periodStart.getMonth() - i);
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd.setMonth(periodEnd.getMonth() - i + 1);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);
      } else if (range === "quarter") {
        periodStart.setMonth(periodStart.getMonth() - i);
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd.setMonth(periodEnd.getMonth() - i + 1);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);
      } else {
        // month
        periodStart.setDate(periodStart.getDate() - i * 7);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd.setDate(periodEnd.getDate() - (i - 1) * 7);
        periodEnd.setHours(23, 59, 59, 999);
      }

      const periodDonations = donations.filter((d) => {
        const dDate = new Date(d.createdAt);
        return dDate >= periodStart && dDate <= periodEnd;
      });
      
      const periodRevenue = periodDonations.reduce((sum, d) => sum + Number(d.amount), 0);

      revenueTrends.push({
        period: periodStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        actual: periodRevenue,
        forecast: periodRevenue * 1.05, // Simple forecast
      });
    }

    // Category distribution
    const categoryGroups = await prisma.donation.groupBy({
      by: ["category"],
      where: {
        createdAt: { gte: startDate },
        status: "completed",
      },
      _sum: { amount: true },
    });
    const categoryDistribution = categoryGroups.map((g) => ({
      name: g.category,
      value: Number(g._sum.amount || 0),
    }));

    // Top donors
    const donorTotals = new Map<string, { name: string; total: number; donations: number }>();
    donations.forEach((d) => {
      if (d.userId && d.user) {
        const existing = donorTotals.get(d.userId) || {
          name: `${d.user.firstName} ${d.user.lastName}`,
          total: 0,
          donations: 0,
        };
        existing.total += Number(d.amount);
        existing.donations += 1;
        donorTotals.set(d.userId, existing);
      }
    });
    const topDonors = Array.from(donorTotals.values())
      .map((d, i) => ({ ...d, id: i.toString() }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Forecast data
    const forecast = revenueTrends.slice(-6).map((r, i) => ({
      period: `Period ${i + 1}`,
      forecast: r.actual * 1.05,
      optimistic: r.actual * 1.15,
      pessimistic: r.actual * 0.95,
    }));

    // Monthly comparison - get previous period data
    const monthlyComparison = [];
    for (let i = Math.min(6, revenueTrends.length) - 1; i >= 0; i--) {
      const currentPeriod = revenueTrends[revenueTrends.length - 1 - i];
      const periodDate = new Date(currentPeriod.period);
      
      // Calculate previous period date
      const previousPeriodDate = new Date(periodDate);
      if (range === "year" || range === "all") {
        previousPeriodDate.setMonth(previousPeriodDate.getMonth() - 12);
      } else if (range === "quarter") {
        previousPeriodDate.setMonth(previousPeriodDate.getMonth() - 3);
      } else {
        previousPeriodDate.setMonth(previousPeriodDate.getMonth() - 1);
      }
      
      // Get previous period donations
      const prevPeriodStart = new Date(previousPeriodDate);
      prevPeriodStart.setDate(1);
      prevPeriodStart.setHours(0, 0, 0, 0);
      const prevPeriodEnd = new Date(previousPeriodDate);
      prevPeriodEnd.setMonth(prevPeriodEnd.getMonth() + 1);
      prevPeriodEnd.setDate(0);
      prevPeriodEnd.setHours(23, 59, 59, 999);
      
      const prevPeriodDonations = await prisma.donation.findMany({
        where: {
          createdAt: {
            gte: prevPeriodStart,
            lte: prevPeriodEnd,
          },
          status: "completed",
        },
      });
      
      const previousRevenue = prevPeriodDonations.reduce((sum, d) => sum + Number(d.amount), 0);
      
      monthlyComparison.push({
        month: currentPeriod.period,
        current: currentPeriod.actual,
        previous: previousRevenue,
      });
    }

    // Donor segmentation
    const donorSegmentation = [
      { segment: "High Value", count: topDonors.filter((d) => d.total > 50000).length },
      { segment: "Medium Value", count: topDonors.filter((d) => d.total > 10000 && d.total <= 50000).length },
      { segment: "Low Value", count: topDonors.filter((d) => d.total <= 10000).length },
    ];

    return NextResponse.json({
      totalRevenue,
      projectedRevenue,
      revenueGrowth: Math.round(revenueGrowth),
      averageDonation: Math.round(averageDonation),
      donorRetention: Math.round(donorRetention),
      revenueTrends,
      categoryDistribution,
      topDonors,
      forecast,
      monthlyComparison,
      donorSegmentation,
    });
  } catch (error: any) {
    console.error("Error fetching financial insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial insights" },
      { status: 500 }
    );
  }
}

