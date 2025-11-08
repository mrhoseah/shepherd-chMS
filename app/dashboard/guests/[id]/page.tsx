import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  ArrowLeft,
  UserCheck,
  History,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GuestProfileTabs } from "@/components/guest-profile-tabs";
import { GuestFollowUpToggle } from "@/components/guest-follow-up-toggle";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuestProfilePage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch guest with related data
  const guest = await prisma.user.findUnique({
    where: { id },
    include: {
      guestVisits: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { visitDate: "desc" },
        take: 50,
      },
      guestFollowUps: {
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!guest) {
    redirect("/dashboard/users");
  }

  // Verify this is a guest
  if (guest.role !== "GUEST") {
    redirect(`/dashboard/users/${id}`);
  }

  const fullName = [guest.title, guest.firstName, guest.lastName]
    .filter(Boolean)
    .join(" ");

  const visitCount = guest.guestVisits.length;
  const isReturningGuest = visitCount > 1;
  const lastVisit = guest.guestVisits[0]?.visitDate;
  const daysSinceLastVisit = lastVisit
    ? Math.floor(
        (new Date().getTime() - new Date(lastVisit).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const pendingFollowUps = guest.guestFollowUps.filter(
    (f) => f.status === "PENDING" || f.status === "SCHEDULED"
  ).length;
  const completedFollowUps = guest.guestFollowUps.filter(
    (f) => f.status === "COMPLETED"
  ).length;

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users?tab=guests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Guests
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {fullName || `${guest.firstName} ${guest.lastName}`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Guest Profile
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isReturningGuest && (
            <Badge variant="default" className="bg-green-600">
              <UserCheck className="w-3 h-3 mr-1" />
              Returning Guest
            </Badge>
          )}
          <Link href={`/dashboard/users/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Visits
                </p>
                <p className="text-2xl font-bold">{visitCount}</p>
              </div>
              <History className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Follow-ups
                </p>
                <p className="text-2xl font-bold">{pendingFollowUps}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed Follow-ups
                </p>
                <p className="text-2xl font-bold">{completedFollowUps}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Days Since Last Visit
                </p>
                <p className="text-2xl font-bold">
                  {daysSinceLastVisit !== null ? daysSinceLastVisit : "N/A"}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {guest.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </p>
                    <p className="font-medium">{guest.email}</p>
                  </div>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone
                    </p>
                    <p className="font-medium">{guest.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {guest.residence && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Residence
                    </p>
                    <p className="font-medium">{guest.residence}</p>
                  </div>
                </div>
              )}
              {guest.city && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    City
                  </p>
                  <p className="font-medium">{guest.city}</p>
                </div>
              )}
              {guest.county && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    County
                  </p>
                  <p className="font-medium">{guest.county}</p>
                </div>
              )}
              {guest.country && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Country
                  </p>
                  <p className="font-medium">{guest.country}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Guest Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Registration Date
                </p>
                <p className="font-medium">
                  {new Date(guest.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Status
                </p>
                <Badge
                  variant={
                    guest.status === "ACTIVE"
                      ? "default"
                      : guest.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {guest.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Follow-up Tracking
                </p>
                <div className="flex items-center gap-2">
                  {guest.enableFollowUps ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-600">Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-400">Disabled</span>
                    </>
                  )}
                </div>
              </div>
              {lastVisit && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last Visit
                  </p>
                  <p className="font-medium">
                    {new Date(lastVisit).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {guest.enableFollowUps && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Follow-up Settings</CardTitle>
              <CardDescription>
                Manage follow-up tracking for this guest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuestFollowUpToggle guestId={guest.id} enabled={guest.enableFollowUps} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs for Visits and Follow-ups */}
      <GuestProfileTabs
        guestId={guest.id}
        enableFollowUps={guest.enableFollowUps}
        visitCount={visitCount}
        followUpCount={guest.guestFollowUps.length}
        visits={guest.guestVisits}
        followUps={guest.guestFollowUps}
      />
    </div>
  );
}

