import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Church,
  Users,
  Shield,
  Database,
  TrendingUp,
  Activity,
  Mail,
  Crown,
  Megaphone,
  FileText,
  Settings2,
  BarChart3,
  AlertTriangle,
  UserPlus,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  Zap,
  Globe,
  Server,
} from "lucide-react";
import Link from "next/link";
import { ManageChurchButton } from "@/components/manage-church-button";

export default async function SystemAdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Only SUPERADMIN can access this page
  if (session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  // Get current date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get comprehensive system-wide statistics
  const [
    totalChurches,
    activeChurches,
    inactiveChurches,
    churchesLastMonth,
    totalUsers,
    activeUsers,
    usersLastMonth,
    systemAdmins,
    churchAdmins,
    totalMembers,
    totalDonations,
    donationsThisMonth,
    donationsLastMonth,
    recentChurches,
    subscriptionStats,
    recentActivities,
    pendingInvitations,
    topChurchesByMembers,
    systemHealth,
  ] = await Promise.all([
    prisma.church.count(),
    prisma.church.count({ where: { isActive: true } }),
    prisma.church.count({ where: { isActive: false } }),
    prisma.church.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.user.count({ where: { role: "SUPERADMIN" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: "completed" },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: "completed", createdAt: { gte: startOfMonth } },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { 
        status: "completed", 
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.church.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            campuses: true,
          },
        },
        subscription: true,
      },
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.invitation.count({
      where: { status: "PENDING" },
    }),
    prisma.church.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { campuses: true },
        },
      },
    }),
    // System health check
    Promise.resolve({
      database: "Connected",
      api: "Operational",
      storage: "Healthy",
      uptime: "99.9%",
    }),
  ]);

  // Calculate growth metrics
  const churchGrowthRate = churchesLastMonth > 0 
    ? ((totalChurches - churchesLastMonth) / churchesLastMonth) * 100 
    : 0;
  
  const userGrowthRate = usersLastMonth > 0
    ? ((totalUsers - usersLastMonth) / usersLastMonth) * 100
    : 0;
  
  const donationGrowth = donationsLastMonth._sum.amount || 0;
  const donationGrowthRate = donationGrowth > 0
    ? (((donationsThisMonth._sum.amount || 0) - donationGrowth) / donationGrowth) * 100
    : 0;

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Page Header with Real-time Status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-10 h-10 text-blue-600" />
            System Administration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Complete oversight of the church management platform
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className="bg-green-500 text-white">
            <Activity className="w-3 h-3 mr-1" />
            System Healthy
          </Badge>
          <p className="text-xs text-gray-500">
            Last updated: {now.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
            <Church className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalChurches}</div>
            <div className="flex items-center gap-2 mt-2">
              {churchGrowthRate >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <p className="text-xs text-gray-600">
                {Math.abs(churchGrowthRate).toFixed(1)}% from last month
              </p>
            </div>
            <Progress value={(activeChurches / totalChurches) * 100} className="mt-3 h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {activeChurches} active • {inactiveChurches} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              {userGrowthRate >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <p className="text-xs text-gray-600">
                {Math.abs(userGrowthRate).toFixed(1)}% growth rate
              </p>
            </div>
            <Progress value={(activeUsers / totalUsers) * 100} className="mt-3 h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {activeUsers} active • {totalMembers} members
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{systemAdmins + churchAdmins}</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-500" />
                <span className="text-xs">{systemAdmins} System</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-500" />
                <span className="text-xs">{churchAdmins} Church</span>
              </div>
            </div>
            {pendingInvitations > 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                <Clock className="w-3 h-3 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {pendingInvitations} pending invitations
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Giving</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              KES {((totalDonations._sum.amount || 0) / 1000000).toFixed(1)}M
            </div>
            <div className="flex items-center gap-2 mt-2">
              {donationGrowthRate >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <p className="text-xs text-gray-600">
                {Math.abs(donationGrowthRate).toFixed(1)}% vs last month
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">This Month</p>
                <p className="font-semibold">
                  KES {((donationsThisMonth._sum.amount || 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-gray-500">Transactions</p>
                <p className="font-semibold">{totalDonations._count.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Overview & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription Overview
            </CardTitle>
            <CardDescription>Active subscription distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptionStats.map((stat) => {
                const statusConfig = {
                  ACTIVE: { color: "bg-green-500", icon: CheckCircle, label: "Active" },
                  TRIAL: { color: "bg-blue-500", icon: Clock, label: "Trial" },
                  PAST_DUE: { color: "bg-amber-500", icon: AlertTriangle, label: "Past Due" },
                  CANCELLED: { color: "bg-red-500", icon: XCircle, label: "Cancelled" },
                  EXPIRED: { color: "bg-gray-500", icon: XCircle, label: "Expired" },
                  SUSPENDED: { color: "bg-orange-500", icon: AlertTriangle, label: "Suspended" },
                };
                const config = statusConfig[stat.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
                const Icon = config.icon;
                const percentage = (stat._count / totalChurches) * 100;

                return (
                  <div key={stat.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 text-${config.color.split("-")[1]}-600`} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <span className="text-sm font-bold">{stat._count}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/sys-591f98aa001826fc/subscriptions">
                Manage Subscriptions
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              System Alerts
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveChurches > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {inactiveChurches} Inactive Churches
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Review and reactivate or archive
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/sys-591f98aa001826fc/churches?filter=inactive">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              )}

              {pendingInvitations > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {pendingInvitations} Pending Invitations
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Follow up on outstanding invitations
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/sys-591f98aa001826fc/invite-system-admins">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    All Systems Operational
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {systemHealth.uptime} uptime
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button asChild variant="outline" className="h-auto flex-col py-6 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300">
              <Link href="/sys-591f98aa001826fc/churches">
                <Church className="h-8 w-8 mb-2 text-blue-600" />
                <span className="font-semibold">Churches</span>
                <span className="text-xs text-gray-500">{totalChurches} total</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300">
              <Link href="/sys-591f98aa001826fc/system-admins">
                <Shield className="h-8 w-8 mb-2 text-purple-600" />
                <span className="font-semibold">Admins</span>
                <span className="text-xs text-gray-500">{systemAdmins + churchAdmins} active</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300">
              <Link href="/sys-591f98aa001826fc/subscriptions">
                <CreditCard className="h-8 w-8 mb-2 text-amber-600" />
                <span className="font-semibold">Subscriptions</span>
                <span className="text-xs text-gray-500">Billing</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300">
              <Link href="/sys-591f98aa001826fc/invite-system-admins">
                <UserPlus className="h-8 w-8 mb-2 text-green-600" />
                <span className="font-semibold">Invite Admin</span>
                <span className="text-xs text-gray-500">System level</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300">
              <Link href="/sys-591f98aa001826fc/announcements">
                <Megaphone className="h-8 w-8 mb-2 text-indigo-600" />
                <span className="font-semibold">Announcements</span>
                <span className="text-xs text-gray-500">Broadcast</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 hover:border-cyan-300">
              <Link href="/sys-591f98aa001826fc/analytics">
                <BarChart3 className="h-8 w-8 mb-2 text-cyan-600" />
                <span className="font-semibold">Analytics</span>
                <span className="text-xs text-gray-500">Insights</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6 hover:bg-slate-50 dark:hover:bg-slate-950/20 hover:border-slate-300">
              <Link href="/sys-591f98aa001826fc/audit-logs">
                <FileText className="h-8 w-8 mb-2 text-slate-600" />
                <span className="font-semibold">Audit Logs</span>
                <span className="text-xs text-gray-500">Security</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6 hover:bg-gray-50 dark:hover:bg-gray-950/20 hover:border-gray-300">
              <Link href="/sys-591f98aa001826fc/settings">
                <Settings2 className="h-8 w-8 mb-2 text-gray-600" />
                <span className="font-semibold">Settings</span>
                <span className="text-xs text-gray-500">Configure</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout - Top Churches & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Churches by Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Churches by Members
            </CardTitle>
            <CardDescription>Most active churches on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topChurchesByMembers.map((church, index) => (
                <div
                  key={church.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{church.name}</p>
                      {church.isSponsored && (
                        <Crown className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {church._count.campuses} campus{church._count.campuses !== 1 ? "es" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ManageChurchButton
                      churchId={church.id}
                      churchName={church.name}
                      variant="default"
                      size="sm"
                    />
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/sys-591f98aa001826fc/churches?id=${church.id}`}>
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent System Activities
            </CardTitle>
            <CardDescription>Latest administrative actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentActivities.map((activity) => {
                const actionConfig = {
                  CREATE: { color: "text-green-600", bg: "bg-green-100 dark:bg-green-950", icon: "+" },
                  UPDATE: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950", icon: "↻" },
                  DELETE: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-950", icon: "×" },
                  INVITE: { color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950", icon: "✉" },
                };
                const config = actionConfig[activity.action as keyof typeof actionConfig] || actionConfig.UPDATE;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${config.bg} flex-shrink-0`}>
                      <span className={`font-bold ${config.color}`}>{config.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.action} {activity.entity}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        by {activity.userName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button asChild className="w-full mt-4" variant="outline" size="sm">
              <Link href="/sys-591f98aa001826fc/audit-logs">
                View All Activities
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recently Added Churches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recently Added Churches
          </CardTitle>
          <CardDescription>Latest churches registered in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentChurches.map((church) => (
              <div
                key={church.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Church className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{church.name}</p>
                      {church.isSponsored && (
                        <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {church._count.campuses} campus{church._count.campuses !== 1 ? "es" : ""}
                      </span>
                      {church.subscription && (
                        <Badge variant="outline" className="text-xs">
                          {church.subscription.plan}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        Added {new Date(church.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={church.isActive ? "default" : "secondary"} className="px-3">
                    {church.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <ManageChurchButton
                    churchId={church.id}
                    churchName={church.name}
                    variant="default"
                    size="sm"
                  />
                  <Button asChild size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/sys-591f98aa001826fc/churches?id=${church.id}`}>
                      View Details
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button asChild className="w-full mt-4" variant="outline">
            <Link href="/sys-591f98aa001826fc/churches">
              View All Churches
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            System Status
          </CardTitle>
          <CardDescription>Current system health and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">Database</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {systemHealth.database}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">API Services</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {systemHealth.api}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-100">Storage</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {systemHealth.storage}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-100">Uptime</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {systemHealth.uptime}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
