import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Wallet,
  Users,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building2,
  Heart,
  Baby,
  UserCircle,
  TrendingUp,
  Crown,
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
import { AddFamilyMemberDialog } from "@/components/add-family-member-dialog";
import { FamilyPhotoUpload } from "@/components/family-photo-upload";
import { FamilyTree } from "@/components/family-tree";
import { AssignFamilyHeadDialog } from "@/components/assign-family-head-dialog";
import { FamilyNameEditor } from "@/components/family-name-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch member with all related data
  const member = await prisma.user.findUnique({
    where: { id },
    include: {
      campus: true,
      spouse: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
      parent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      children: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
        },
      },
      familyHead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
      donations: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      groupMemberships: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
      attendances: {
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });

  if (!member) {
    redirect("/dashboard/users");
  }

  // Calculate giving statistics
  const totalGiving = member.donations
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const thisYearGiving = member.donations
    .filter(
      (d) =>
        d.status === "completed" &&
        d.createdAt >= new Date(new Date().getFullYear(), 0, 1)
    )
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const donationCount = member.donations.filter(
    (d) => d.status === "completed"
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="sm">
              ← Back to Members
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {member.firstName} {member.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Member Profile
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={member.status === "ACTIVE" ? "default" : "secondary"}
          >
            {member.status}
          </Badge>
          <Badge variant="outline">{member.role}</Badge>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>
                    {member.firstName.charAt(0)}
                    {member.lastName.charAt(0)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="text-gray-900 dark:text-white">
                  {member.email || "Not provided"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Phone</span>
                </div>
                <p className="text-gray-900 dark:text-white">
                  {member.phone || "Not provided"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Address</span>
                </div>
                <p className="text-gray-900 dark:text-white">
                  {member.address
                    ? `${member.address}, ${member.city || ""} ${member.state || ""}`
                    : "Not provided"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">Campus</span>
                </div>
                <p className="text-gray-900 dark:text-white">
                  {member.campus?.name || "Not assigned"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="giving">
            <Wallet className="w-4 h-4 mr-2" />
            Giving
          </TabsTrigger>
          <TabsTrigger value="family">
            <Users className="w-4 h-4 mr-2" />
            Family Tree
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Calendar className="w-4 h-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="groups">
            <UserCircle className="w-4 h-4 mr-2" />
            Groups
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Full Name
                  </span>
                  <p className="font-medium">
                    {member.firstName} {member.middleName || ""} {member.lastName}
                  </p>
                </div>
                {member.dateOfBirth && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Date of Birth
                    </span>
                    <p className="font-medium">
                      {new Date(member.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {member.gender && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Gender
                    </span>
                    <p className="font-medium">{member.gender}</p>
                  </div>
                )}
                {member.maritalStatus && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Marital Status
                    </span>
                    <p className="font-medium">{member.maritalStatus}</p>
                  </div>
                )}
                {member.memberSince && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Member Since
                    </span>
                    <p className="font-medium">
                      {new Date(member.memberSince).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {member.baptismDate && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Baptism Date
                    </span>
                    <p className="font-medium">
                      {new Date(member.baptismDate).toLocaleDateString()}
                    </p>
                    {member.baptismLocation && (
                      <p className="text-sm text-gray-500">
                        {member.baptismLocation}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Giving Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Giving
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      ${totalGiving.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      This Year
                    </span>
                    <span className="text-xl font-semibold">
                      ${thisYearGiving.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Donations
                    </span>
                    <span className="text-lg font-medium">{donationCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {member.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">{member.bio}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Giving Tab */}
        <TabsContent value="giving" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Giving History</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Given
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${totalGiving.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {member.donations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(donation.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{donation.category}</Badge>
                        </TableCell>
                        <TableCell>{donation.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              donation.status === "completed"
                                ? "default"
                                : donation.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {donation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {donation.transactionId || donation.reference || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No donations recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Tree Tab */}
        <TabsContent value="family" className="space-y-4">
          {/* Family Head Section */}
          {(() => {
            // Collect all family members for the dialog
            const allFamilyMembers = [
              { id: member.id, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone },
              ...(member.spouse ? [{ id: member.spouse.id, firstName: member.spouse.firstName, lastName: member.spouse.lastName, email: member.spouse.email, phone: member.spouse.phone }] : []),
              ...(member.parent ? [{ id: member.parent.id, firstName: member.parent.firstName, lastName: member.parent.lastName, email: member.parent.email, phone: member.parent.phone }] : []),
              ...member.children.map(child => ({ id: child.id, firstName: child.firstName, lastName: child.lastName, email: child.email, phone: child.phone })),
            ];
            // Remove duplicates
            const uniqueFamilyMembers = Array.from(
              new Map(allFamilyMembers.map(m => [m.id, m])).values()
            );

            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Family Head
                    </CardTitle>
                    <AssignFamilyHeadDialog
                      userId={member.id}
                      currentFamilyHead={member.familyHead}
                      familyMembers={uniqueFamilyMembers}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.familyHead ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-600 dark:text-yellow-300 font-semibold text-lg">
                          {member.familyHead.firstName.charAt(0)}
                          {member.familyHead.lastName.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/users/${member.familyHead.id}`}
                            className="font-semibold text-lg hover:underline flex items-center gap-2"
                          >
                            {member.familyHead.firstName} {member.familyHead.lastName}
                            <Crown className="w-4 h-4 text-yellow-500" />
                          </Link>
                          {member.familyHead.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {member.familyHead.email}
                            </p>
                          )}
                          {member.familyHead.phone && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {member.familyHead.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <FamilyNameEditor
                          userId={member.id}
                          currentFamilyName={member.familyName}
                          hasFamilyHead={!!member.familyHead}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <Crown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No family head assigned</p>
                      <p className="text-sm mt-1">Assign a family head to manage family information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Family Photo Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Family Photo
                </CardTitle>
                <FamilyPhotoUpload userId={member.id} currentPhoto={member.familyPhoto} />
              </div>
            </CardHeader>
            {member.familyPhoto && (
              <CardContent>
                <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                  <img
                    src={member.familyPhoto}
                    alt="Family photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Family Tree Visualization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Family Tree
                </CardTitle>
                <AddFamilyMemberDialog userId={member.id} />
              </div>
            </CardHeader>
            <CardContent>
              <FamilyTree
                member={member}
                spouse={member.spouse}
                parent={member.parent}
                children={member.children}
              />
            </CardContent>
          </Card>

          {/* Detailed Family Members List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {member.spouse && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Spouse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                      {member.spouse.firstName.charAt(0)}
                      {member.spouse.lastName.charAt(0)}
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/users/${member.spouse.id}`}
                        className="font-semibold text-lg hover:underline"
                      >
                        {member.spouse.firstName} {member.spouse.lastName}
                      </Link>
                      {member.spouse.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.spouse.email}
                        </p>
                      )}
                      {member.spouse.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.spouse.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {member.parent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5" />
                    Parent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-semibold">
                      {member.parent.firstName.charAt(0)}
                      {member.parent.lastName.charAt(0)}
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/users/${member.parent.id}`}
                        className="font-semibold text-lg hover:underline"
                      >
                        {member.parent.firstName} {member.parent.lastName}
                      </Link>
                      {member.parent.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.parent.email}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {member.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="w-5 h-5" />
                  Children ({member.children.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {member.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 font-semibold">
                        {child.firstName.charAt(0)}
                        {child.lastName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/dashboard/users/${child.id}`}
                          className="font-medium hover:underline block"
                        >
                          {child.firstName} {child.lastName}
                        </Link>
                        {child.dateOfBirth && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                          </p>
                        )}
                        {child.email && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {child.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!member.spouse && !member.parent && member.children.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No family relationships recorded</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {member.attendances.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.attendances.map((attendance) => (
                      <TableRow key={attendance.id}>
                        <TableCell>
                          {new Date(attendance.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{attendance.type}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              attendance.status === "PRESENT"
                                ? "default"
                                : attendance.status === "EXCUSED"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {attendance.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {attendance.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No attendance records</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Memberships</CardTitle>
            </CardHeader>
            <CardContent>
              {member.groupMemberships.length > 0 ? (
                <div className="space-y-3">
                  {member.groupMemberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {membership.group.name}
                        </h3>
                        {membership.group.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {membership.group.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{membership.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Not a member of any groups</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

