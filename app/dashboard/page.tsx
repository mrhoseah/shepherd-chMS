import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGreeting } from "@/lib/greeting";
import { RoleBasedDashboard } from "@/components/dashboard/role-based-dashboard";

export default async function DashboardPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    // If session decryption fails, redirect to sign in
    console.error("Session error:", error);
    redirect("/auth/signin");
  }

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Use role-based dashboard
  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {getGreeting(session?.user?.name)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome to your church management dashboard
        </p>
      </div>

      {/* Role-Based Dashboard */}
      <RoleBasedDashboard />
    </div>
  );
}

// Legacy dashboard code (kept for reference, can be removed later)
export async function LegacyDashboardPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Session error:", error);
    redirect("/auth/signin");
  }

  const [
    totalMembers,
    activeMembers,
    newMembersThisMonth,
    weeklyGiving,
    lastWeekGiving,
    serviceAttendance,
    fourWeekAttendanceCount,
    activeVolunteers,
    upcomingEvents,
    recentDonations,
    recentActivity,
    urgentTasks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        status: "completed",
      },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        status: "completed",
      },
    }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        type: "service",
      },
    }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        type: "service",
      },
    }),
    prisma.volunteerAssignment.count({
      where: { status: "active" },
    }),
    prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
        status: { not: "CANCELLED" },
      },
      take: 3,
      orderBy: { startDate: "asc" },
      include: {
        campus: { select: { name: true } },
      },
    }),
    prisma.donation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        status: "PENDING",
      },
      take: 3,
    }),
  ]);

  const fourWeekAverage = fourWeekAttendanceCount / 4;

  const weeklyGivingAmount = Number(weeklyGiving._sum.amount || 0);
  const lastWeekGivingAmount = Number(lastWeekGiving._sum.amount || 0);
  const givingChange =
    lastWeekGivingAmount > 0
      ? ((weeklyGivingAmount - lastWeekGivingAmount) / lastWeekGivingAmount) * 100
      : 0;
  const attendanceChange =
    fourWeekAverage > 0
      ? ((serviceAttendance - fourWeekAverage) / fourWeekAverage) * 100
      : 0;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {getGreeting(session?.user?.name)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome to your church management dashboard
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Members - Faith Green */}
          <Card className="border-b-4 transform hover:scale-[1.01] transition duration-200" style={{ borderBottomColor: "#059669" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Total Members
              </CardTitle>
              <Users className="w-6 h-6" style={{ color: "#059669" }} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {totalMembers.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-semibold" style={{ color: "#059669" }}>
                  +{newMembersThisMonth}{" "}
                </span>
                new this month
              </p>
            </CardContent>
          </Card>

          {/* This Week's Giving - Faith Green */}
          <Card className="border-b-4 transform hover:scale-[1.01] transition duration-200" style={{ borderBottomColor: "#059669" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                This Week's Giving
              </CardTitle>
              <Wallet className="w-6 h-6" style={{ color: "#059669" }} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${weeklyGivingAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                <span
                  className="font-semibold"
                  style={{ color: givingChange >= 0 ? "#059669" : "#DC2626" }}
                >
                  {givingChange >= 0 ? "+" : ""}
                  {givingChange.toFixed(1)}%{" "}
                </span>
                from last week
              </p>
            </CardContent>
          </Card>

          {/* Service Attendance - Gold */}
          <Card className="border-b-4 transform hover:scale-[1.01] transition duration-200" style={{ borderBottomColor: "#F59E0B" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Service Attendance
              </CardTitle>
              <Sun className="w-6 h-6" style={{ color: "#F59E0B" }} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {serviceAttendance}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                <span
                  className="font-semibold"
                  style={{ color: attendanceChange >= 0 ? "#F59E0B" : "#DC2626" }}
                >
                  {attendanceChange >= 0 ? "+" : ""}
                  {attendanceChange.toFixed(1)}%{" "}
                </span>
                vs. 4-week average
              </p>
            </CardContent>
          </Card>

          {/* Active Volunteers - Shepherd Blue */}
          <Card className="border-b-4 transform hover:scale-[1.01] transition duration-200" style={{ borderBottomColor: "#1E40AF" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Active Volunteers
              </CardTitle>
              <ClipboardList className="w-6 h-6" style={{ color: "#1E40AF" }} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {activeVolunteers}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-semibold" style={{ color: "#1E40AF" }}>95% </span>
                fulfilled in schedule
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events & Urgent Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.startDate);
                  const dayName = eventDate.toLocaleDateString("en-US", {
                    weekday: "short",
                  }).toUpperCase();
                  const dayNum = eventDate.getDate();
                  return (
                    <div
                      key={event.id}
                      className="flex items-start space-x-3 border-b pb-4 last:border-0"
                    >
                      <div className="p-2 rounded-lg text-center font-bold flex-shrink-0 min-w-[50px]" style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}>
                        <p className="text-sm leading-none">{dayName}</p>
                        <p className="text-lg leading-none">{dayNum}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatTime(eventDate)} | {event.location || "TBD"}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {upcomingEvents.length === 0 && (
                  <p className="text-gray-500 text-sm">No upcoming events</p>
                )}
              </div>
              <Link href="/dashboard/events">
                <Button
                  variant="outline"
                  className="w-full mt-4 hover:bg-gray-50"
                  style={{ borderColor: "#1E40AF", color: "#1E40AF" }}
                >
                  View Full Calendar
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Urgent Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Urgent Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {urgentTasks.length > 0 && (
                  <li className="p-3 rounded-lg border flex justify-between items-center" style={{ backgroundColor: "#FEF2F2", borderColor: "#DC2626" }}>
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: "#DC2626" }} />
                      <div>
                        <p className="text-gray-900 font-medium">
                          🚨 Pending Member Approvals
                        </p>
                        <p className="text-sm text-gray-600">
                          {urgentTasks.length} new member(s) awaiting approval.
                        </p>
                      </div>
                    </div>
                    <Link href="/dashboard/users">
                      <Button
                        variant="link"
                        className="hover:underline text-sm font-medium flex-shrink-0"
                        style={{ color: "#DC2626" }}
                      >
                        Review
                      </Button>
                    </Link>
                  </li>
                )}
                <li className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">
                        💬 Follow-up Reminders
                      </p>
                      <p className="text-sm text-gray-600">
                        Check in with recent visitors and new members.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="link"
                    className="text-yellow-600 hover:underline text-sm font-medium flex-shrink-0"
                  >
                    View
                  </Button>
                </li>
                <li className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <UsersRound className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 font-medium">
                        🗓️ Volunteer Scheduling
                      </p>
                      <p className="text-sm text-gray-600">
                        Review and fill upcoming volunteer slots.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="link"
                    className="text-blue-600 hover:underline text-sm font-medium flex-shrink-0"
                  >
                    Manage
                  </Button>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full mt-4 border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                View All Pending Tasks
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview & Member Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Financial Overview (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    Giving Trends
                  </h3>
                  <div className="h-48 bg-gray-50 rounded-lg p-4 flex items-end justify-center space-x-2">
                    {/* Simple bar chart representation */}
                    {[65, 75, 60, 80, 70, 85, 90].map((height, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center space-y-1"
                      >
                        <div
                          className="rounded-t w-8 hover:opacity-80 transition"
                          style={{ 
                            height: `${height}%`,
                            backgroundColor: "#1E40AF"
                          }}
                        />
                        <span className="text-xs text-gray-500">Wk{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Monthly Goal: $65,000</span>
                    <span className="font-semibold flex items-center" style={{ color: "#059669" }}>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      On Track
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Member Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Member Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-sm">
                {recentActivity.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex justify-between items-center text-gray-700 border-b pb-3 last:border-0"
                  >
                    <p>
                      <span className="font-semibold">
                        {activity.user?.firstName} {activity.user?.lastName}
                      </span>{" "}
                      {activity.action}
                    </p>
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {recentActivity.length === 0 && (
                  <li className="text-gray-500 text-sm">No recent activity</li>
                )}
              </ul>
              <Link href="/dashboard/users">
                <Button
                  variant="outline"
                  className="w-full mt-4 hover:bg-gray-50"
                  style={{ borderColor: "#1E40AF", color: "#1E40AF" }}
                >
                  View Full Log
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Communications Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Communications Snapshot (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end h-56 w-full py-4 space-x-6 justify-center">
              <div className="flex flex-col items-center">
                <div className="bg-blue-600 rounded-t-lg w-8 hover:bg-blue-700 transition duration-150 h-[70%]" />
                <span className="text-xs text-gray-600 mt-2">Email Open (70%)</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-green-500 rounded-t-lg w-8 hover:bg-green-600 transition duration-150 h-[90%]" />
                <span className="text-xs text-gray-600 mt-2">Text Read (90%)</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-orange-500 rounded-t-lg w-8 hover:bg-orange-600 transition duration-150 h-[55%]" />
                <span className="text-xs text-gray-600 mt-2">
                  App Notifications (55%)
                </span>
              </div>
              <div className="flex flex-col items-center ml-10 border-l pl-6">
                <span className="text-4xl font-bold text-gray-900">45</span>
                <span className="text-sm text-gray-500 mt-1">
                  Total Campaigns Sent
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
