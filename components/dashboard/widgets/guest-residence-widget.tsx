"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ArrowRight, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ResidenceStat {
  residence: string;
  city?: string;
  county?: string;
  guestCount: number;
}

interface GuestResidenceWidgetProps {
  widgetId: string;
}

export function GuestResidenceWidget({ widgetId }: GuestResidenceWidgetProps) {
  const [data, setData] = useState<{
    residences: ResidenceStat[];
    totalGuests: number;
    topResidence: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/guest-residence");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching guest residence data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-cyan-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-cyan-100/80 backdrop-blur-sm">
              <MapPin className="w-5 h-5 text-cyan-600" />
            </div>
            Guest Residence
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-cyan-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-cyan-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-cyan-100/80 backdrop-blur-sm group-hover:bg-cyan-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <MapPin className="w-5 h-5 text-cyan-600" />
          </div>
          Guest Residence
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-cyan-100 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Total Guests</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalGuests}</p>
              </div>
              {data.topResidence && (
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Top Area</p>
                  <p className="text-sm font-semibold text-cyan-600">{data.topResidence}</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {data.residences.slice(0, 5).map((residence, index) => {
              const percentage = data.totalGuests > 0 
                ? Math.round((residence.guestCount / data.totalGuests) * 100)
                : 0;
              return (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-cyan-100 hover:border-cyan-200 hover:bg-white/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {residence.residence || "Unknown"}
                      </p>
                      {(residence.city || residence.county) && (
                        <p className="text-xs text-gray-600 truncate">
                          {[residence.city, residence.county].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <Users className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="text-sm font-bold text-gray-900">{residence.guestCount}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{percentage}% of total guests</p>
                </div>
              );
            })}
          </div>
          {data.residences.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No guest residence data available</p>
            </div>
          )}
        </div>
        <Link href="/dashboard/guests?filter=residence" className="block">
          <Button 
            variant="outline" 
            className="w-full border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 group/btn transition-all duration-200"
          >
            View All Guests
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

