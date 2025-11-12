"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Settings,
  MessageSquare,
  BarChart3,
  Plus,
  Upload,
  Send,
  Bell,
  QrCode,
} from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      icon: UserPlus,
      label: "Add Member",
      href: "/dashboard/people/new",
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      borderColor: "border-blue-200",
    },
    {
      icon: Calendar,
      label: "Create Event",
      href: "/dashboard/events/new",
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      borderColor: "border-purple-200",
    },
    {
      icon: DollarSign,
      label: "Record Donation",
      href: "/dashboard/giving/new",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 hover:bg-emerald-100",
      borderColor: "border-emerald-200",
    },
    {
      icon: QrCode,
      label: "Print QR Codes",
      href: "/dashboard/giving/qr-print",
      color: "text-teal-600",
      bgColor: "bg-teal-50 hover:bg-teal-100",
      borderColor: "border-teal-200",
    },
    {
      icon: Users,
      label: "Add Group",
      href: "/dashboard/groups/new",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 hover:bg-indigo-100",
      borderColor: "border-indigo-200",
    },
    {
      icon: MessageSquare,
      label: "Send Message",
      href: "/dashboard/communications",
      color: "text-pink-600",
      bgColor: "bg-pink-50 hover:bg-pink-100",
      borderColor: "border-pink-200",
    },
    {
      icon: FileText,
      label: "Generate Report",
      href: "/dashboard/reports",
      color: "text-amber-600",
      bgColor: "bg-amber-50 hover:bg-amber-100",
      borderColor: "border-amber-200",
    },
    {
      icon: Upload,
      label: "Upload Media",
      href: "/dashboard/media",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 hover:bg-cyan-100",
      borderColor: "border-cyan-200",
    },
    {
      icon: Bell,
      label: "Send Announcement",
      href: "/dashboard/communications/announcements",
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
      borderColor: "border-orange-200",
    },
  ];

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl -mr-16 -mt-16" />
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button
                  variant="outline"
                  className={`w-full h-auto flex-col items-center justify-center gap-2 p-4 ${action.bgColor} ${action.borderColor} border-2 hover:scale-105 transition-all duration-200`}
                >
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  <span className={`text-xs font-medium ${action.color}`}>
                    {action.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

