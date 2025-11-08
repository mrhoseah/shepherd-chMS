"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowRight, Cross, Droplets } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SpiritualMilestonesWidgetProps {
  widgetId: string;
}

export function SpiritualMilestonesWidget({ widgetId }: SpiritualMilestonesWidgetProps) {
  const [data, setData] = useState<{
    baptisms: number;
    confirmations: number;
    newBelievers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/spiritual-milestones");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching spiritual milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-rose-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-rose-100/80 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            Spiritual Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-rose-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-rose-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-rose-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-rose-100/80 backdrop-blur-sm group-hover:bg-rose-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Heart className="w-5 h-5 text-rose-600" />
          </div>
          Spiritual Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100 hover:border-blue-200 transition-colors text-center">
            <Droplets className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.baptisms}</p>
            <p className="text-xs text-gray-600 mt-1">Baptisms</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-purple-100 hover:border-purple-200 transition-colors text-center">
            <Cross className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.confirmations}</p>
            <p className="text-xs text-gray-600 mt-1">Confirmations</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-100 hover:border-emerald-200 transition-colors text-center">
            <Heart className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.newBelievers}</p>
            <p className="text-xs text-gray-600 mt-1">New Believers</p>
          </div>
        </div>
        <Link href="/dashboard/milestones" className="block">
          <Button 
            variant="outline" 
            className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 group/btn transition-all duration-200"
          >
            View All Milestones
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

