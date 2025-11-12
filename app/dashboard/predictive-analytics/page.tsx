"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  Target,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function PredictiveAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [forecastPeriod, setForecastPeriod] = useState("12");
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchPredictions();
  }, [forecastPeriod]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/predictive-analytics?period=${forecastPeriod}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="text-center py-12">Loading predictive analytics...</div>
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = data?.revenue
    ? [
        ...data.revenue.historical.map((h: any) => ({
          month: h.month,
          actual: h.value,
          predicted: null,
          optimistic: null,
          pessimistic: null,
        })),
        ...data.revenue.forecast.map((f: any) => ({
          month: f.month,
          actual: null,
          predicted: f.predicted,
          optimistic: f.optimistic,
          pessimistic: f.pessimistic,
        })),
      ]
    : [];

  const memberChartData = data?.members
    ? [
        ...data.members.historical.map((h: any) => ({
          month: h.month,
          actual: h.value,
          predicted: null,
        })),
        ...data.members.forecast.map((f: any) => ({
          month: f.month,
          actual: null,
          predicted: f.predicted,
        })),
      ]
    : [];

  const attendanceChartData = data?.attendance
    ? [
        ...data.attendance.historical.map((h: any) => ({
          month: h.month,
          actual: h.value,
          predicted: null,
        })),
        ...data.attendance.forecast.map((f: any) => ({
          month: f.month,
          actual: null,
          predicted: f.predicted,
        })),
      ]
    : [];

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-8 h-8" />
            Predictive Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered forecasting and trend predictions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
              <SelectItem value="18">18 Months</SelectItem>
              <SelectItem value="24">24 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.revenue?.trend?.direction === "up" ? (
                <span className="text-green-600">↑ Growing</span>
              ) : data?.revenue?.trend?.direction === "down" ? (
                <span className="text-red-600">↓ Declining</span>
              ) : (
                <span className="text-gray-600">→ Stable</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Confidence: {data?.revenue?.trend?.confidence || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.members?.projectedTotal?.toLocaleString() || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current: {data?.members?.currentTotal?.toLocaleString() || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Members</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.atRisk?.highRisk || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.atRisk?.mediumRisk || 0} medium risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Trend</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.attendance?.trend === "increasing" ? (
                <span className="text-green-600">↑ Increasing</span>
              ) : data?.attendance?.trend === "decreasing" ? (
                <span className="text-red-600">↓ Decreasing</span>
              ) : (
                <span className="text-gray-600">→ Stable</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {data?.attendance?.average?.toLocaleString() || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="atRisk">At-Risk Members</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Forecast */}
            {data?.revenue && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Forecast</CardTitle>
                  <CardDescription>
                    {forecastPeriod}-month revenue prediction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Actual"
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.3}
                        strokeDasharray="5 5"
                        name="Predicted"
                      />
                      <Area
                        type="monotone"
                        dataKey="optimistic"
                        stroke="#00C49F"
                        fill="none"
                        strokeDasharray="3 3"
                        name="Optimistic"
                      />
                      <Area
                        type="monotone"
                        dataKey="pessimistic"
                        stroke="#FF8042"
                        fill="none"
                        strokeDasharray="3 3"
                        name="Pessimistic"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Member Growth */}
            {data?.members && (
              <Card>
                <CardHeader>
                  <CardTitle>Member Growth Forecast</CardTitle>
                  <CardDescription>
                    Projected new members over {forecastPeriod} months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={memberChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#8884d8"
                        name="Actual"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#82ca9d"
                        strokeDasharray="5 5"
                        name="Predicted"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm">
                      <strong>Projected Total:</strong> {data.members.projectedTotal?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Growth Rate: {data.members.growthRate?.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {data?.revenue ? (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast & Trends</CardTitle>
                <CardDescription>
                  Historical data and {forecastPeriod}-month forecast
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `KES ${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Actual Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                      strokeDasharray="5 5"
                      name="Predicted"
                    />
                    <Area
                      type="monotone"
                      dataKey="optimistic"
                      stroke="#00C49F"
                      fill="none"
                      strokeDasharray="3 3"
                      name="Optimistic"
                    />
                    <Area
                      type="monotone"
                      dataKey="pessimistic"
                      stroke="#FF8042"
                      fill="none"
                      strokeDasharray="3 3"
                      name="Pessimistic"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
                    <p className="text-lg font-semibold capitalize">
                      {data.revenue.trend.direction}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                    <p className="text-lg font-semibold capitalize">
                      {data.revenue.trend.confidence}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</p>
                    <p className="text-lg font-semibold">
                      {data.revenue.trend.rate > 0 ? "+" : ""}
                      {data.revenue.trend.rate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No revenue data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {data?.members ? (
            <Card>
              <CardHeader>
                <CardTitle>Member Growth Forecast</CardTitle>
                <CardDescription>
                  New member predictions over {forecastPeriod} months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={memberChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#8884d8"
                      name="Actual New Members"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#82ca9d"
                      strokeDasharray="5 5"
                      name="Predicted New Members"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Total</p>
                    <p className="text-2xl font-bold">{data.members.currentTotal?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Projected Total</p>
                    <p className="text-2xl font-bold">{data.members.projectedTotal?.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No member data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          {data?.attendance ? (
            <Card>
              <CardHeader>
                <CardTitle>Attendance Forecast</CardTitle>
                <CardDescription>
                  Attendance predictions over {forecastPeriod} months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={attendanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#8884d8"
                      name="Actual Attendance"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#82ca9d"
                      strokeDasharray="5 5"
                      name="Predicted Attendance"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Attendance</p>
                  <p className="text-2xl font-bold">{data.attendance.average?.toLocaleString()}</p>
                  <p className="text-sm mt-2">
                    Trend: <span className="font-semibold capitalize">{data.attendance.trend}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No attendance data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="atRisk" className="space-y-4">
          {data?.atRisk ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">High Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data.atRisk.highRisk}</div>
                    <p className="text-sm text-gray-500 mt-1">Members at risk</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-yellow-600">Medium Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data.atRisk.mediumRisk}</div>
                    <p className="text-sm text-gray-500 mt-1">Members at risk</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Low Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data.atRisk.lowRisk}</div>
                    <p className="text-sm text-gray-500 mt-1">Members at risk</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>High-Risk Members</CardTitle>
                  <CardDescription>
                    Members showing declining engagement patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.atRisk.members?.map((member: any) => (
                      <div
                        key={member.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={member.riskScore >= 70 ? "destructive" : "default"}
                              className="mb-2"
                            >
                              Risk: {member.riskScore}%
                            </Badge>
                            <div className="text-sm text-gray-500">
                              {member.attendanceDecline < 0 && (
                                <p>Attendance: {member.attendanceDecline.toFixed(1)}%</p>
                              )}
                              {member.givingDecline < 0 && (
                                <p>Giving: {member.givingDecline.toFixed(1)}%</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No at-risk member data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {data?.categories ? (
            <Card>
              <CardHeader>
                <CardTitle>Giving Category Trends</CardTitle>
                <CardDescription>Trends and growth rates by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.categories.map((cat: any) => (
                    <div key={cat.category} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{cat.category}</p>
                          <p className="text-sm text-gray-500">
                            Total: KES {cat.total.toLocaleString()} ({cat.count} donations)
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              cat.trend === "growing"
                                ? "default"
                                : cat.trend === "declining"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {cat.trend === "growing" && <TrendingUp className="w-3 h-3 mr-1" />}
                            {cat.trend === "declining" && <TrendingDown className="w-3 h-3 mr-1" />}
                            {cat.trend}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {cat.growthRate > 0 ? "+" : ""}
                            {cat.growthRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Average: KES {cat.average.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No category data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

