"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Mail,
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { BarChartComponent, LineChartComponent, PieChartComponent } from "@/components/reports/chart-components";

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/communications/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching communication stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Communications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage SMS, email, and other communication channels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/communications/sms">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send SMS
            </Button>
          </Link>
          <Link href="/dashboard/communications/email">
            <Button>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sent (30d)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats?.totalSent || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.smsSent || 0} SMS • {stats?.emailsSent || 0} Emails
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-200/50">
                    <Send className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats?.successRate ? `${stats.successRate.toFixed(1)}%` : "0%"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats?.successful || 0} successful
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-200/50">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats?.emailOpenRate ? `${stats.emailOpenRate.toFixed(1)}%` : "0%"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Email engagement
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-200/50">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Recipients</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats?.activeRecipients || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      With valid contact info
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-200/50">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Communication Trends (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.dailyBreakdown ? (
                  <LineChartComponent
                    data={stats.dailyBreakdown.map((item: any) => ({
                      name: format(new Date(item.date), "MMM dd"),
                      SMS: item.sms || 0,
                      Email: item.email || 0,
                    }))}
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Communication by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <PieChartComponent
                    data={[
                      { name: "SMS", value: stats.smsSent || 0 },
                      { name: "Email", value: stats.emailsSent || 0 },
                    ]}
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Communications</CardTitle>
                <Link href="/dashboard/communications/history">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentCommunications && stats.recentCommunications.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentCommunications.slice(0, 5).map((comm: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            comm.type === "SMS"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-purple-100 text-purple-600"
                          }`}
                        >
                          {comm.type === "SMS" ? (
                            <MessageSquare className="w-5 h-5" />
                          ) : (
                            <Mail className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {comm.subject || comm.message?.substring(0, 50) || "Communication"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {comm.recipientCount || 0} recipients • {format(new Date(comm.createdAt), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {comm.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent communications</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/communications/sms">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-blue-50 to-blue-100/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-200/50">
                      <MessageSquare className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Send SMS</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Send text messages to members
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/communications/email">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-purple-100/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-200/50">
                      <Mail className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Send Email</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Send emails to members
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/communications/templates">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-200/50">
                      <Plus className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Templates</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage message templates
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">SMS Communications</h2>
              <p className="text-gray-600 mt-1">Send and manage text messages</p>
            </div>
            <Link href="/dashboard/communications/sms">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New SMS
              </Button>
            </Link>
          </div>

          {/* SMS Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">SMS Sent (30d)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats?.smsSent || 0}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats?.smsSuccessRate ? `${stats.smsSuccessRate.toFixed(1)}%` : "0%"}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recipients</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats?.smsRecipients || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SMS Content - Embed or redirect */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-blue-600 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  SMS Management
                </h3>
                <p className="text-gray-600 mb-6">
                  Send SMS messages, view history, and manage templates
                </p>
                <Link href="/dashboard/communications/sms">
                  <Button>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Go to SMS Page
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Email Communications</h2>
              <p className="text-gray-600 mt-1">Send and manage email campaigns</p>
            </div>
            <Link href="/dashboard/communications/email">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Email
              </Button>
            </Link>
          </div>

          {/* Email Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Emails Sent (30d)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats?.emailsSent || 0}
                    </p>
                  </div>
                  <Mail className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats?.emailOpenRate ? `${stats.emailOpenRate.toFixed(1)}%` : "0%"}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Click Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats?.emailClickRate ? `${stats.emailClickRate.toFixed(1)}%` : "0%"}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recipients</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats?.emailRecipients || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-cyan-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Content - Embed or redirect */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-purple-600 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email Management
                </h3>
                <p className="text-gray-600 mb-6">
                  Send email campaigns, view analytics, and manage templates
                </p>
                <Link href="/dashboard/communications/email">
                  <Button>
                    <Mail className="w-4 h-4 mr-2" />
                    Go to Email Page
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

