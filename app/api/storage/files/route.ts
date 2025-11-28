import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listFiles, checkStorageQuota } from "@/lib/storage";
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // List files
    const result = await listFiles(churchId, {
      category,
      entityType,
      entityId,
      search,
      page,
      limit,
    });

    // Get storage quota
    const quota = await checkStorageQuota(churchId);

    return NextResponse.json({
      success: true,
      files: result.files,
      pagination: result.pagination,
      quota: {
        used: quota.usedGB,
        total: quota.quotaGB,
        remaining: quota.remainingGB,
        percentUsed: quota.percentUsed,
        totalFiles: quota.totalFiles,
      },
    });
  } catch (error: any) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list files" },
      { status: 500 }
    );
  }
}
