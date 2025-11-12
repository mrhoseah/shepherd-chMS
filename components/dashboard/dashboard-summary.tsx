"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Activity,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryData {
  members: {
    total: number;
    newThisMonth: number;
    growth: number;
  };
  giving: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  attendance: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  events: {
    upcoming: number;
    thisMonth: number;
  };
}

export function DashboardSummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/dashboard/summary");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const summaryItems = [
    {
      title: "Members",
      value: data.members.total.toLocaleString(),
      change: data.members.growth,
      changeLabel: `${data.members.newThisMonth} new this month`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      href: "/dashboard/people",
    },
    {
      title: "Monthly Giving",
      value: formatCurrency(data.giving.thisMonth),
      change: data.giving.growth,
      changeLabel: "vs last month",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      href: "/dashboard/giving",
    },
    {
      title: "Attendance",
      value: data.attendance.thisMonth.toLocaleString(),
      change: data.attendance.growth,
      changeLabel: "vs last month",
      icon: Activity,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      href: "/dashboard/attendance",
    },
    {
      title: "Upcoming Events",
      value: data.events.upcoming.toString(),
      change: null,
      changeLabel: `${data.events.thisMonth} this month`,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      href: "/dashboard/events",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryItems.map((item) => {
        const Icon = item.icon;
        const isPositive = item.change !== null && item.change >= 0;
        return (
        <Card
          key={item.title}
          className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${item.bgColor} hover:scale-[1.02]`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-12 -mt-12" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${item.bgColor} border ${item.borderColor}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              {item.change !== null && (
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    isPositive ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {isPositive ? "+" : ""}
                  {item.change.toFixed(1)}%
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-2">
              {item.title}
            </h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{item.value}</p>
            <p className="text-xs text-gray-600 mb-4">{item.changeLabel}</p>
            <Link href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs ${item.color} hover:${item.bgColor} group/btn w-full justify-between`}
              >
                View Details
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      );
      })}
    </div>
  );
}

