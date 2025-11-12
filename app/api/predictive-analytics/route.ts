import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Predictive Analytics API
 * Provides forecasting and predictions for various metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get("metric") || "all";
    const period = searchParams.get("period") || "12"; // months to forecast

    const now = new Date();
    const monthsToForecast = parseInt(period);

    // Get historical data (last 24 months)
    const historicalStart = new Date(now);
    historicalStart.setMonth(historicalStart.getMonth() - 24);

    const results: any = {};

    // Revenue Forecasting
    if (metric === "all" || metric === "revenue") {
      const donations = await prisma.donation.findMany({
        where: {
          status: "completed",
          createdAt: { gte: historicalStart },
        },
        select: {
          amount: true,
          createdAt: true,
          category: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by month
      const monthlyRevenue: Record<string, number> = {};
      donations.forEach((d) => {
        const monthKey = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, "0")}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(d.amount);
      });

      // Calculate trend (simple linear regression)
      const months = Object.keys(monthlyRevenue).sort();
      const values = months.map((m) => monthlyRevenue[m]);
      
      if (values.length >= 3) {
        const n = values.length;
        const sumX = months.reduce((sum, _, i) => sum + i, 0);
        const sumY = values.reduce((sum, v) => sum + v, 0);
        const sumXY = months.reduce((sum, _, i) => sum + i * values[i], 0);
        const sumX2 = months.reduce((sum, _, i) => sum + i * i, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Generate forecast
        const forecast = [];
        const lastValue = values[values.length - 1];
        const avgGrowth = slope;
        
        for (let i = 1; i <= monthsToForecast; i++) {
          const forecastDate = new Date(now);
          forecastDate.setMonth(forecastDate.getMonth() + i);
          const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`;
          
          // Simple exponential smoothing with trend
          const predicted = lastValue + avgGrowth * i;
          const optimistic = predicted * 1.15; // 15% optimistic
          const pessimistic = predicted * 0.85; // 15% pessimistic
          
          forecast.push({
            month: monthKey,
            predicted: Math.max(0, predicted),
            optimistic: Math.max(0, optimistic),
            pessimistic: Math.max(0, pessimistic),
          });
        }

        results.revenue = {
          historical: months.map((m, i) => ({
            month: m,
            value: values[i],
          })),
          forecast,
          trend: {
            direction: slope > 0 ? "up" : slope < 0 ? "down" : "stable",
            rate: Math.abs(slope),
            confidence: values.length >= 12 ? "high" : values.length >= 6 ? "medium" : "low",
          },
        };
      }
    }

    // Member Growth Prediction
    if (metric === "all" || metric === "members") {
      const members = await prisma.user.findMany({
        where: {
          createdAt: { gte: historicalStart },
          role: { not: "GUEST" },
        },
        select: {
          createdAt: true,
          role: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by month
      const monthlyGrowth: Record<string, number> = {};
      members.forEach((m) => {
        const monthKey = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, "0")}`;
        monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1;
      });

      const months = Object.keys(monthlyGrowth).sort();
      const values = months.map((m) => monthlyGrowth[m]);
      const totalMembers = await prisma.user.count({
        where: { role: { not: "GUEST" } },
      });

      if (values.length >= 3) {
        const avgGrowth = values.reduce((sum, v) => sum + v, 0) / values.length;
        const recentAvg = values.slice(-6).reduce((sum, v) => sum + v, 0) / Math.min(6, values.length);
        
        const forecast = [];
        for (let i = 1; i <= monthsToForecast; i++) {
          const forecastDate = new Date(now);
          forecastDate.setMonth(forecastDate.getMonth() + i);
          const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`;
          
          // Use recent average with slight adjustment
          const predicted = recentAvg * 0.95; // Slight decline assumption
          const optimistic = recentAvg * 1.1;
          const pessimistic = recentAvg * 0.8;
          
          forecast.push({
            month: monthKey,
            predicted: Math.round(predicted),
            optimistic: Math.round(optimistic),
            pessimistic: Math.round(pessimistic),
          });
        }

        results.members = {
          historical: months.map((m, i) => ({
            month: m,
            value: values[i],
          })),
          forecast,
          currentTotal: totalMembers,
          projectedTotal: totalMembers + forecast.reduce((sum, f) => sum + f.predicted, 0),
          growthRate: ((recentAvg - avgGrowth) / avgGrowth) * 100,
        };
      }
    }

    // Attendance Prediction
    if (metric === "all" || metric === "attendance") {
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          status: "PRESENT",
          createdAt: { gte: historicalStart },
        },
        include: {
          session: {
            select: {
              date: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by month
      const monthlyAttendance: Record<string, number> = {};
      attendanceRecords.forEach((a) => {
        const date = a.session?.date || a.createdAt;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyAttendance[monthKey] = (monthlyAttendance[monthKey] || 0) + 1;
      });

      const months = Object.keys(monthlyAttendance).sort();
      const values = months.map((m) => monthlyAttendance[m]);

      if (values.length >= 3) {
        const avgAttendance = values.reduce((sum, v) => sum + v, 0) / values.length;
        const recentAvg = values.slice(-6).reduce((sum, v) => sum + v, 0) / Math.min(6, values.length);
        
        // Calculate seasonal pattern (if we have enough data)
        const seasonalFactor = values.length >= 12 ? calculateSeasonalFactor(values) : null;
        
        const forecast = [];
        for (let i = 1; i <= monthsToForecast; i++) {
          const forecastDate = new Date(now);
          forecastDate.setMonth(forecastDate.getMonth() + i);
          const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`;
          
          let predicted = recentAvg;
          if (seasonalFactor) {
            const monthIndex = forecastDate.getMonth();
            predicted = recentAvg * seasonalFactor[monthIndex];
          }
          
          const optimistic = predicted * 1.1;
          const pessimistic = predicted * 0.9;
          
          forecast.push({
            month: monthKey,
            predicted: Math.round(predicted),
            optimistic: Math.round(optimistic),
            pessimistic: Math.round(pessimistic),
          });
        }

        results.attendance = {
          historical: months.map((m, i) => ({
            month: m,
            value: values[i],
          })),
          forecast,
          average: Math.round(avgAttendance),
          trend: recentAvg > avgAttendance ? "increasing" : recentAvg < avgAttendance ? "decreasing" : "stable",
        };
      }
    }

    // At-Risk Member Prediction
    if (metric === "all" || metric === "atRisk") {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Get members with declining engagement
      const allMembers = await prisma.user.findMany({
        where: {
          role: { not: "GUEST" },
          status: "ACTIVE",
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
      });

      const atRiskMembers = await Promise.all(
        allMembers.map(async (member) => {
          const [recentAttendance, oldAttendance, recentGiving, oldGiving] = await Promise.all([
            prisma.attendance.count({
              where: {
                userId: member.id,
                status: "PRESENT",
                createdAt: { gte: threeMonthsAgo },
              },
            }),
            prisma.attendance.count({
              where: {
                userId: member.id,
                status: "PRESENT",
                createdAt: {
                  gte: sixMonthsAgo,
                  lt: threeMonthsAgo,
                },
              },
            }),
            prisma.donation.count({
              where: {
                userId: member.id,
                status: "completed",
                createdAt: { gte: threeMonthsAgo },
              },
            }),
            prisma.donation.count({
              where: {
                userId: member.id,
                status: "completed",
                createdAt: {
                  gte: sixMonthsAgo,
                  lt: threeMonthsAgo,
                },
              },
            }),
          ]);

          const attendanceDecline = oldAttendance > 0 
            ? ((recentAttendance - oldAttendance) / oldAttendance) * 100 
            : 0;
          const givingDecline = oldGiving > 0 
            ? ((recentGiving - oldGiving) / oldGiving) * 100 
            : 0;

          // Calculate risk score (0-100)
          let riskScore = 0;
          if (attendanceDecline < -50) riskScore += 40;
          else if (attendanceDecline < -30) riskScore += 25;
          else if (attendanceDecline < -10) riskScore += 10;

          if (givingDecline < -50) riskScore += 30;
          else if (givingDecline < -30) riskScore += 20;
          else if (givingDecline < -10) riskScore += 10;

          if (recentAttendance === 0 && oldAttendance > 0) riskScore += 30;
          if (recentGiving === 0 && oldGiving > 0) riskScore += 20;

          return {
            id: member.id,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            riskScore: Math.min(100, riskScore),
            attendanceDecline,
            givingDecline,
            recentAttendance,
            oldAttendance,
            recentGiving,
            oldGiving,
          };
        })
      );

      const highRisk = atRiskMembers
        .filter((m) => m.riskScore >= 50)
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 20);

      results.atRisk = {
        total: atRiskMembers.length,
        highRisk: highRisk.length,
        mediumRisk: atRiskMembers.filter((m) => m.riskScore >= 30 && m.riskScore < 50).length,
        lowRisk: atRiskMembers.filter((m) => m.riskScore < 30).length,
        members: highRisk,
      };
    }

    // Giving Category Trends
    if (metric === "all" || metric === "categories") {
      const donations = await prisma.donation.findMany({
        where: {
          status: "completed",
          createdAt: { gte: historicalStart },
        },
        select: {
          amount: true,
          category: true,
          createdAt: true,
        },
      });

      const categoryTrends: Record<string, any> = {};
      donations.forEach((d) => {
        if (!categoryTrends[d.category]) {
          categoryTrends[d.category] = {
            total: 0,
            count: 0,
            monthly: {} as Record<string, number>,
          };
        }
        categoryTrends[d.category].total += Number(d.amount);
        categoryTrends[d.category].count += 1;
        
        const monthKey = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, "0")}`;
        categoryTrends[d.category].monthly[monthKey] = 
          (categoryTrends[d.category].monthly[monthKey] || 0) + Number(d.amount);
      });

      results.categories = Object.entries(categoryTrends).map(([category, data]: [string, any]) => {
        const months = Object.keys(data.monthly).sort();
        const values = months.map((m) => data.monthly[m]);
        const avgGrowth = values.length >= 2 
          ? ((values[values.length - 1] - values[0]) / values[0]) * 100 
          : 0;

        return {
          category,
          total: data.total,
          count: data.count,
          average: data.total / data.count,
          trend: avgGrowth > 5 ? "growing" : avgGrowth < -5 ? "declining" : "stable",
          growthRate: avgGrowth,
        };
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error generating predictive analytics:", error);
    return NextResponse.json(
      { error: "Failed to generate predictive analytics" },
      { status: 500 }
    );
  }
}

/**
 * Calculate seasonal factors for each month (0-11)
 */
function calculateSeasonalFactor(values: number[]): number[] {
  if (values.length < 12) return Array(12).fill(1);
  
  const monthlyAverages: number[] = [];
  const overallAverage = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  // Group by month position in year
  for (let month = 0; month < 12; month++) {
    const monthValues: number[] = [];
    for (let i = month; i < values.length; i += 12) {
      monthValues.push(values[i]);
    }
    if (monthValues.length > 0) {
      monthlyAverages[month] = monthValues.reduce((sum, v) => sum + v, 0) / monthValues.length;
    } else {
      monthlyAverages[month] = overallAverage;
    }
  }
  
  // Calculate seasonal factors
  return monthlyAverages.map((avg) => avg / overallAverage);
}

