"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ArrowRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MyProfileWidgetProps {
  widgetId: string;
}

export function MyProfileWidget({ widgetId }: MyProfileWidgetProps) {
  const [data, setData] = useState<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/my-profile");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-green-100/80 backdrop-blur-sm">
              <User className="w-5 h-5 text-green-600" />
            </div>
            My Profile
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
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-green-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-green-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-green-100/80 backdrop-blur-sm group-hover:bg-green-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <User className="w-5 h-5 text-green-600" />
          </div>
          My Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-green-100 mb-3">
            <p className="text-xl font-bold text-gray-900 mb-3">
              {data.firstName} {data.lastName}
            </p>
            <div className="space-y-2">
              {data.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{data.email}</span>
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{data.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="px-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {data.status}
            </span>
          </div>
        </div>
        <Link href="/dashboard/profile" className="block">
          <Button 
            variant="outline" 
            className="w-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 group/btn transition-all duration-200"
          >
            Edit Profile
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

