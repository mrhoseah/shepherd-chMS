"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight, UserPlus, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface UserManagementWidgetProps {
  widgetId: string;
}

export function UserManagementWidget({ widgetId }: UserManagementWidgetProps) {
  const [data, setData] = useState<{
    total: number;
    pending: number;
    active: number;
    inactive: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/user-management");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching user management data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-indigo-100/80 backdrop-blur-sm">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-indigo-100/80 backdrop-blur-sm group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-indigo-100 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.total}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-100 hover:border-amber-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Pending</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.pending}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-100 hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Active</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.active}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Inactive</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.inactive}</p>
          </div>
        </div>
        <Link href="/dashboard/users" className="block">
          <Button 
            variant="outline" 
            className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 group/btn transition-all duration-200"
          >
            Manage Users
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

