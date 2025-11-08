"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, ArrowRight, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Fund {
  name: string;
  budgeted: number;
  received: number;
  percentage: number;
}

interface FundTrackingWidgetProps {
  widgetId: string;
}

export function FundTrackingWidget({ widgetId }: FundTrackingWidgetProps) {
  const [data, setData] = useState<{
    funds: Fund[];
    totalBudgeted: number;
    totalReceived: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/fund-tracking");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching fund tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-blue-100/80 backdrop-blur-sm">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            Fund Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-10" />
        </CardContent>
      </Card>
    );
  }

  const overallPercentage = data.totalBudgeted > 0 
    ? Math.round((data.totalReceived / data.totalBudgeted) * 100)
    : 0;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-blue-100/80 backdrop-blur-sm group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          Fund Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-lg font-bold text-blue-600">{overallPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>${data.totalReceived.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              <span>${data.totalBudgeted.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div className="space-y-3">
            {data.funds.slice(0, 3).map((fund, index) => (
              <div key={index} className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{fund.name}</p>
                  <span className="text-xs font-medium text-blue-600">{fund.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${fund.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>${fund.received.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  <span>${fund.budgeted.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Link href="/dashboard/funds" className="block">
          <Button 
            variant="outline" 
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 group/btn transition-all duration-200"
          >
            View All Funds
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

