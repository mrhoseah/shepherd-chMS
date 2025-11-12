"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  Search,
  BarChart3,
  Target,
  DollarSign,
  Calendar,
  MessageSquare,
  Handshake,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const COLORS = {
  excellent: "#10b981", // green
  good: "#3b82f6", // blue
  fair: "#f59e0b", // yellow
  poor: "#f97316", // orange
  critical: "#ef4444", // red
};

const STATUS_COLORS = {
  excellent: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  good: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  fair: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  poor: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

export default function MemberHealthPage() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchHealthData();
  }, [filter]);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/member-health?filter=${filter}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = async (memberId: string) => {
    try {
      const response = await fetch(`/api/member-health?memberId=${memberId}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedMember(result);
        setMemberDetailOpen(true);
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
    }
  };

  const filteredMembers = data?.members?.filter((m: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.member.name.toLowerCase().includes(query) ||
      m.member.email?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="text-center py-12">Loading member health data...</div>
      </div>
    );
  }

  // Prepare chart data
  const distributionData = data?.distribution
    ? [
        { name: "Excellent", value: data.distribution.excellent, color: COLORS.excellent },
        { name: "Good", value: data.distribution.good, color: COLORS.good },
        { name: "Fair", value: data.distribution.fair, color: COLORS.fair },
        { name: "Poor", value: data.distribution.poor, color: COLORS.poor },
        { name: "Critical", value: data.distribution.critical, color: COLORS.critical },
      ]
    : [];

  const concernsData = data?.concerns
    ? [
        { name: "No Attendance", value: data.concerns.noRecentAttendance },
        { name: "No Giving", value: data.concerns.noRecentGiving },
        { name: "No Groups", value: data.concerns.noGroupMembership },
        { name: "Declining", value: data.concerns.decliningEngagement },
      ]
    : [];

  // Prepare radar chart data for selected member
  const radarData = selectedMember?.health
    ? [
        {
          subject: "Attendance",
          score: selectedMember.health.factors.attendanceScore,
          fullMark: 100,
        },
        {
          subject: "Giving",
          score: selectedMember.health.factors.givingScore,
          fullMark: 100,
        },
        {
          subject: "Groups",
          score: selectedMember.health.factors.groupScore,
          fullMark: 100,
        },
        {
          subject: "Events",
          score: selectedMember.health.factors.eventScore,
          fullMark: 100,
        },
        {
          subject: "Communication",
          score: selectedMember.health.factors.communicationScore,
          fullMark: 100,
        },
        {
          subject: "Volunteer",
          score: selectedMember.health.factors.volunteerScore,
          fullMark: 100,
        },
      ]
    : [];

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            Member Health Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive health monitoring and insights for church members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="at-risk">At-Risk</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.stats?.healthy || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.stats?.total
                ? Math.round((data.stats.healthy / data.stats.total) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data?.stats?.atRisk || 0}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.stats?.critical || 0}
            </div>
            <p className="text-xs text-muted-foreground">Urgent action needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.averageScore || 0}</div>
            <p className="text-xs text-muted-foreground">Overall health</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="concerns">Concerns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Health Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Health Distribution</CardTitle>
                <CardDescription>Member health status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Concerns */}
            <Card>
              <CardHeader>
                <CardTitle>Top Concerns</CardTitle>
                <CardDescription>Common health issues identified</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={concernsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers?.map((item: any) => {
              const { member, health } = item;
              return (
                <Card
                  key={member.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleMemberClick(member.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{member.name}</CardTitle>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <Badge className={STATUS_COLORS[health.status as keyof typeof STATUS_COLORS]}>
                        {health.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Health Score</span>
                          <span className="text-lg font-bold">{health.overallScore}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              health.overallScore >= 70
                                ? "bg-green-500"
                                : health.overallScore >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${health.overallScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        {health.trend === "improving" && (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                        {health.trend === "declining" && (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        {health.trend === "stable" && (
                          <Activity className="w-4 h-4 text-gray-600" />
                        )}
                        <span className="capitalize">{health.trend}</span>
                      </div>

                      {health.concerns.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-1">Concerns:</p>
                          <div className="flex flex-wrap gap-1">
                            {health.concerns.slice(0, 2).map((concern: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {concern}
                              </Badge>
                            ))}
                            {health.concerns.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{health.concerns.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="concerns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  No Recent Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.concerns?.noRecentAttendance || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Members with no attendance in 3 months</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  No Recent Giving
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.concerns?.noRecentGiving || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Members with no giving in 3 months</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-600" />
                  No Group Membership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.concerns?.noGroupMembership || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Members not in any groups</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Declining Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.concerns?.decliningEngagement || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Members showing declining patterns</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Member Detail Dialog */}
      <Dialog open={memberDetailOpen} onOpenChange={setMemberDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMember?.member?.name}</DialogTitle>
            <DialogDescription>Detailed health analysis</DialogDescription>
          </DialogHeader>

          {selectedMember?.health && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-4xl font-bold">{selectedMember.health.overallScore}</div>
                      <Badge
                        className={`mt-2 ${STATUS_COLORS[selectedMember.health.status as keyof typeof STATUS_COLORS]}`}
                      >
                        {selectedMember.health.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Trend</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedMember.health.trend === "improving" && (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        )}
                        {selectedMember.health.trend === "declining" && (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        {selectedMember.health.trend === "stable" && (
                          <Activity className="w-5 h-5 text-gray-600" />
                        )}
                        <span className="capitalize font-medium">
                          {selectedMember.health.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        selectedMember.health.overallScore >= 70
                          ? "bg-green-500"
                          : selectedMember.health.overallScore >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${selectedMember.health.overallScore}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Health Factors Radar */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Factors</CardTitle>
                  <CardDescription>Breakdown by engagement area</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Detailed Factors */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Attendance</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {selectedMember.health.factors.attendanceScore}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMember.health.factors.attendanceCount} services (3 months)
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">Giving</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {selectedMember.health.factors.givingScore}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMember.health.factors.givingCount} donations
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Groups</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {selectedMember.health.factors.groupScore}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMember.health.factors.groupCount} memberships
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4" />
                        <span className="font-medium">Events</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {selectedMember.health.factors.eventScore}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMember.health.factors.eventCount} registrations
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">Communication</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {selectedMember.health.factors.communicationScore}
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Handshake className="w-4 h-4" />
                        <span className="font-medium">Volunteer</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {selectedMember.health.factors.volunteerScore}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMember.health.factors.volunteerCount} assignments
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Concerns */}
              {selectedMember.health.concerns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Concerns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedMember.health.concerns.map((concern: string, idx: number) => (
                        <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <p className="text-sm">{concern}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

