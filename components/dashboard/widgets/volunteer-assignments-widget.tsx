"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, ArrowRight, UserCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface VolunteerAssignment {
  id: string;
  role: string;
  eventName: string;
  assigned: number;
  needed: number;
  status: string;
}

interface VolunteerAssignmentsWidgetProps {
  widgetId: string;
}

export function VolunteerAssignmentsWidget({ widgetId }: VolunteerAssignmentsWidgetProps) {
  const [data, setData] = useState<{
    assignments: VolunteerAssignment[];
    totalAssigned: number;
    totalNeeded: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/volunteer-assignments");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching volunteer assignments:", error);
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
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            Volunteer Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const fulfillmentRate = data.totalNeeded > 0 
    ? Math.round((data.totalAssigned / data.totalNeeded) * 100)
    : 0;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-blue-100/80 backdrop-blur-sm group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          Volunteer Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Fulfillment Rate</span>
              <Badge variant={fulfillmentRate >= 90 ? "default" : fulfillmentRate >= 70 ? "secondary" : "destructive"} className="bg-blue-100 text-blue-700">
                {fulfillmentRate}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  fulfillmentRate >= 90 ? "bg-green-500" : fulfillmentRate >= 70 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${fulfillmentRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {data.totalAssigned} of {data.totalNeeded} positions filled
            </p>
          </div>
          <div className="space-y-3">
            {data.assignments.slice(0, 4).map((assignment) => {
              const percentage = assignment.needed > 0 
                ? Math.round((assignment.assigned / assignment.needed) * 100)
                : 0;
              return (
                <div
                  key={assignment.id}
                  className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100 hover:border-blue-200 hover:bg-white/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{assignment.role}</p>
                      <p className="text-xs text-gray-600">{assignment.eventName}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0 ml-2">
                      <UserCheck className="w-3 h-3" />
                      <span>{assignment.assigned}/{assignment.needed}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        percentage >= 100 ? "bg-green-500" : percentage >= 70 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Link href="/dashboard/volunteers/assignments" className="block">
          <Button 
            variant="outline" 
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 group/btn transition-all duration-200"
          >
            Manage Assignments
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

