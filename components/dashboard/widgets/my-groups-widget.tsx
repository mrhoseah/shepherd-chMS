"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface MyGroupsWidgetProps {
  widgetId: string;
}

export function MyGroupsWidget({ widgetId }: MyGroupsWidgetProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/my-groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-lime-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-lime-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-lime-100/80 backdrop-blur-sm">
              <Users className="w-5 h-5 text-lime-600" />
            </div>
            My Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-lime-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-lime-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-lime-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-500 via-lime-400 to-lime-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-lime-100/80 backdrop-blur-sm group-hover:bg-lime-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Users className="w-5 h-5 text-lime-600" />
          </div>
          My Groups
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">You're not in any groups yet</p>
            <Link href="/dashboard/groups">
              <Button variant="outline" size="sm" className="border-lime-200 text-lime-600">
                Browse Groups
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {groups.slice(0, 3).map((group) => (
                <div
                  key={group.id}
                  className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-lime-100 hover:border-lime-200 hover:bg-white/80 transition-all duration-200"
                >
                  <p className="text-sm font-semibold text-gray-900 mb-1">{group.name}</p>
                  {group.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{group.description}</p>
                  )}
                </div>
              ))}
            </div>
            <Link href="/dashboard/groups" className="block">
              <Button 
                variant="outline" 
                className="w-full border-lime-200 text-lime-600 hover:bg-lime-50 hover:border-lime-300 group/btn transition-all duration-200"
              >
                View All Groups
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

