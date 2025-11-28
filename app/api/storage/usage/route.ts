import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkStorageQuota, updateStorageUsage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { campus: { select: { churchId: true } } },
    });

    if (!user || !user.campus?.churchId) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    const churchId = user.campus.churchId;

    // Get detailed storage usage
    const storageUsage = await prisma.storageUsage.findUnique({
      where: { churchId },
    });

    if (!storageUsage) {
      return NextResponse.json({ error: "Storage usage not found" }, { status: 404 });
    }

    // Get quota info
    const quota = await checkStorageQuota(churchId);

    // Get file breakdown by category
    const categoryBreakdown = await prisma.storageFile.groupBy({
      by: ["category"],
      where: {
        churchId,
        isDeleted: false,
      },
      _count: {
        id: true,
      },
      _sum: {
        fileSize: true,
      },
    });

    const formatBytes = (bytes: bigint) => {
      const gb = Number(bytes) / (1024 * 1024 * 1024);
      if (gb >= 1) return `${gb.toFixed(2)} GB`;
      const mb = Number(bytes) / (1024 * 1024);
      if (mb >= 1) return `${mb.toFixed(2)} MB`;
      const kb = Number(bytes) / 1024;
      return `${kb.toFixed(2)} KB`;
    };

    return NextResponse.json({
      success: true,
      usage: {
        quota: quota.quotaGB,
        used: quota.usedGB,
        remaining: quota.remainingGB,
        percentUsed: quota.percentUsed,
        isOverQuota: quota.isOverQuota,
        totalFiles: quota.totalFiles,
      },
      breakdown: {
        documents: {
          size: formatBytes(storageUsage.documentsUsed),
          sizeGB: Number(storageUsage.documentsUsed) / (1024 * 1024 * 1024),
          files:
            categoryBreakdown.find((c) => c.category === "DOCUMENT")?._count.id ||
            0,
        },
        images: {
          size: formatBytes(storageUsage.imagesUsed),
          sizeGB: Number(storageUsage.imagesUsed) / (1024 * 1024 * 1024),
          files:
            (categoryBreakdown.find((c) => c.category === "IMAGE")?._count.id ||
              0) +
            (categoryBreakdown.find((c) => c.category === "PROFILE_PHOTO")?._count
              .id || 0) +
            (categoryBreakdown.find((c) => c.category === "LOGO")?._count.id ||
              0) +
            (categoryBreakdown.find((c) => c.category === "BANNER")?._count.id ||
              0),
        },
        videos: {
          size: formatBytes(storageUsage.videosUsed),
          sizeGB: Number(storageUsage.videosUsed) / (1024 * 1024 * 1024),
          files:
            categoryBreakdown.find((c) => c.category === "VIDEO")?._count.id || 0,
        },
        other: {
          size: formatBytes(storageUsage.otherUsed),
          sizeGB: Number(storageUsage.otherUsed) / (1024 * 1024 * 1024),
          files:
            (categoryBreakdown.find((c) => c.category === "OTHER")?._count.id ||
              0) +
            (categoryBreakdown.find((c) => c.category === "AUDIO")?._count.id ||
              0) +
            (categoryBreakdown.find((c) => c.category === "ATTACHMENT")?._count
              .id || 0) +
            (categoryBreakdown.find((c) => c.category === "PRESENTATION")?._count
              .id || 0),
        },
      },
      lastCalculated: storageUsage.lastCalculated,
    });
  } catch (error: any) {
    console.error("Storage usage error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get storage usage" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { campus: { select: { churchId: true } } },
    });

    if (!user || !user.campus?.churchId) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // Only admins can recalculate usage
    if (!["SUPERADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only administrators can recalculate storage usage" },
        { status: 403 }
      );
    }

    const churchId = user.campus.churchId;

    // Recalculate storage usage
    await updateStorageUsage(churchId);

    // Get updated quota
    const quota = await checkStorageQuota(churchId);

    return NextResponse.json({
      success: true,
      message: "Storage usage recalculated successfully",
      usage: {
        quota: quota.quotaGB,
        used: quota.usedGB,
        remaining: quota.remainingGB,
        percentUsed: quota.percentUsed,
        totalFiles: quota.totalFiles,
      },
    });
  } catch (error: any) {
    console.error("Recalculate storage error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to recalculate storage usage" },
      { status: 500 }
    );
  }
}
