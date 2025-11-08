"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowRight, Clock, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface PrayerRequest {
  id: string;
  title: string;
  requester: { firstName: string; lastName: string } | null;
  status: string;
  createdAt: string;
}

interface PrayerRequestsWidgetProps {
  widgetId: string;
}

export function PrayerRequestsWidget({ widgetId }: PrayerRequestsWidgetProps) {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/prayer-requests?limit=5");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-pink-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-pink-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-pink-100/80 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            Prayer Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-pink-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-pink-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-pink-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-pink-100/80 backdrop-blur-sm group-hover:bg-pink-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Heart className="w-5 h-5 text-pink-600" />
          </div>
          Prayer Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No prayer requests</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-pink-100 hover:border-pink-200 hover:bg-white/80 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">{request.title}</p>
                  <Badge 
                    variant={request.status === "active" ? "default" : "secondary"}
                    className="bg-pink-100 text-pink-700 text-xs"
                  >
                    {request.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {request.requester && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{request.requester.firstName} {request.requester.lastName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/dashboard/prayer-requests" className="block">
          <Button 
            variant="outline" 
            className="w-full border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 group/btn transition-all duration-200"
          >
            View All Requests
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

