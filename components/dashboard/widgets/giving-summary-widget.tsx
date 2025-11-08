"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface GivingSummaryWidgetProps {
  widgetId: string;
}

export function GivingSummaryWidget({ widgetId }: GivingSummaryWidgetProps) {
  const [data, setData] = useState<{
    monthly: number;
    yearly: number;
    averageGift: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/giving-summary");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching giving summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-emerald-100/80 backdrop-blur-sm">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            Giving Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-10" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-emerald-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-emerald-100/80 backdrop-blur-sm group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          Giving Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-4 mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-100">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">This Month</p>
            <p className="text-3xl font-bold text-gray-900">
              ${data.monthly.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-100">
              <p className="text-xs text-gray-600 mb-1">Yearly</p>
              <p className="text-lg font-bold text-gray-900">
                ${(data.yearly / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-100">
              <p className="text-xs text-gray-600 mb-1">Avg Gift</p>
              <p className="text-lg font-bold text-gray-900">
                ${data.averageGift.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
        <Link href="/dashboard/giving" className="block">
          <Button 
            variant="outline" 
            className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 group/btn transition-all duration-200"
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

