"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DonorManagementWidgetProps {
  widgetId: string;
}

export function DonorManagementWidget({ widgetId }: DonorManagementWidgetProps) {
  const [data, setData] = useState<{
    totalDonors: number;
    activeDonors: number;
    newThisMonth: number;
    totalDonations: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/donor-management");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching donor management data:", error);
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
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            Donor Management
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
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
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          Donor Management
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-100 hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Donors</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.totalDonors}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Active</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.activeDonors}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-100 hover:border-amber-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">New This Month</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.newThisMonth}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-green-100 hover:border-green-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Donations</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${(data.totalDonations / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
        <Link href="/dashboard/donors" className="block">
          <Button 
            variant="outline" 
            className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 group/btn transition-all duration-200"
          >
            Manage Donors
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

