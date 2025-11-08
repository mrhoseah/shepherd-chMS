"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Calendar, Users, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WelcomeWidgetProps {
  widgetId: string;
}

export function WelcomeWidget({ widgetId }: WelcomeWidgetProps) {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetch("/api/dashboard/widgets/welcome")
      .then((res) => res.json())
      .then((data) => {
        if (data.name) {
          setUserName(data.name);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-purple-100/30 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-100/20 rounded-full blur-3xl -ml-24 -mb-24" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}!
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-gray-700 mb-6 leading-relaxed">
          Welcome to Eastgate Chapel! We're excited to have you here. Explore your dashboard to stay connected with our community.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/dashboard/events" className="group/item">
            <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100 hover:border-blue-200 hover:bg-white/80 transition-all duration-200">
              <Calendar className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900 mb-1">Upcoming Events</p>
              <p className="text-xs text-gray-600">See what's happening</p>
            </div>
          </Link>
          <Link href="/dashboard/groups" className="group/item">
            <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-purple-100 hover:border-purple-200 hover:bg-white/80 transition-all duration-200">
              <Users className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900 mb-1">Join Groups</p>
              <p className="text-xs text-gray-600">Connect with others</p>
            </div>
          </Link>
          <Link href="/dashboard/profile" className="group/item">
            <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-pink-100 hover:border-pink-200 hover:bg-white/80 transition-all duration-200">
              <Heart className="w-6 h-6 text-pink-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900 mb-1">Your Profile</p>
              <p className="text-xs text-gray-600">Update information</p>
            </div>
          </Link>
        </div>
        <Link href="/dashboard" className="block">
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group/btn transition-all duration-200"
          >
            Explore Dashboard
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

