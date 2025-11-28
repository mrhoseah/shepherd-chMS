import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  HardDrive,
  FileText,
  Image,
  Video,
  Music,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

export default async function StorageManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/auth/signin");
  }

  // Get storage statistics
  const storageUsages = await prisma.storageUsage.findMany({
    include: {
      church: {
        select: {
          id: true,
          name: true,
          subscription: {
            select: {
              plan: true,
              maxStorage: true,
            },
          },
        },
      },
    },
    orderBy: {
      totalUsed: "desc",
    },
    take: 10,
  });

  // Calculate totals
  const totalStorageUsed = storageUsages.reduce((sum, usage) => sum + Number(usage.totalUsed), 0);
  const totalFiles = storageUsages.reduce((sum, usage) => sum + usage.totalFiles, 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage storage usage across all churches
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalStorageUsed)}</div>
            <p className="text-xs text-muted-foreground">
              Across {storageUsages.length} churches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Files stored in S3
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(
                storageUsages.reduce((sum, usage) => sum + Number(usage.imagesUsed), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Image storage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(
                storageUsages.reduce((sum, usage) => sum + Number(usage.documentsUsed), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Document storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Storage Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top Storage Users</CardTitle>
          <CardDescription>
            Churches using the most storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storageUsages.map((usage) => {
              const quotaGB = usage.church.subscription?.maxStorage || usage.quotaGB;
              const quotaBytes = quotaGB * 1024 * 1024 * 1024;
              const usedBytes = Number(usage.totalUsed);
              const percentage = (usedBytes / quotaBytes) * 100;
              const isNearLimit = percentage > 80;

              return (
                <div key={usage.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {usage.church.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(usedBytes)} / {quotaGB} GB
                        {" · "}
                        {usage.totalFiles} files
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isNearLimit && (
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Near Limit
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {usage.church.subscription?.plan || "FREE"}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% used
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Storage Breakdown by Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Storage by Type</CardTitle>
            <CardDescription>Distribution of storage across file types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "Documents",
                bytes: storageUsages.reduce(
                  (sum, usage) => sum + Number(usage.documentsUsed),
                  0
                ),
                icon: FileText,
                color: "text-blue-500",
              },
              {
                label: "Images",
                bytes: storageUsages.reduce(
                  (sum, usage) => sum + Number(usage.imagesUsed),
                  0
                ),
                icon: Image,
                color: "text-green-500",
              },
              {
                label: "Videos",
                bytes: storageUsages.reduce(
                  (sum, usage) => sum + Number(usage.videosUsed),
                  0
                ),
                icon: Video,
                color: "text-purple-500",
              },
              {
                label: "Other",
                bytes: storageUsages.reduce(
                  (sum, usage) => sum + Number(usage.otherUsed),
                  0
                ),
                icon: HardDrive,
                color: "text-gray-500",
              },
            ].map((type) => {
              const percentage = totalStorageUsed > 0
                ? (type.bytes / totalStorageUsed) * 100
                : 0;

              return (
                <div key={type.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <type.icon className={`h-4 w-4 ${type.color}`} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatBytes(type.bytes)}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest storage operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Storage activity tracking coming soon...
              </p>
              {/* TODO: Add storage activity log */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
