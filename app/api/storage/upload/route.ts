import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile, checkStorageQuota } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

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

    const churchId = user.campus.churchId;

    // Check storage quota first
    const quota = await checkStorageQuota(churchId);
    if (quota.isOverQuota) {
      return NextResponse.json(
        {
          error: "Storage quota exceeded",
          quota: {
            used: quota.usedGB,
            total: quota.quotaGB,
            percentUsed: quota.percentUsed,
          },
        },
        { status: 413 } // Payload Too Large
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "OTHER";
    const entityType = formData.get("entityType") as string | undefined;
    const entityId = formData.get("entityId") as string | undefined;
    const isPublic = formData.get("isPublic") === "true";
    const tags = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (check against remaining quota)
    const fileSizeGB = file.size / (1024 * 1024 * 1024);
    if (fileSizeGB > quota.remainingGB) {
      return NextResponse.json(
        {
          error: "File too large",
          fileSize: fileSizeGB.toFixed(2),
          remaining: quota.remainingGB.toFixed(2),
        },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file
    const result = await uploadFile(buffer, file.name, file.type, {
      churchId,
      uploadedById: user.id,
      category: category as any,
      entityType,
      entityId,
      isPublic,
      tags,
    });

    // Get updated quota
    const updatedQuota = await checkStorageQuota(churchId);

    return NextResponse.json({
      success: true,
      file: result,
      quota: {
        used: updatedQuota.usedGB,
        total: updatedQuota.quotaGB,
        remaining: updatedQuota.remainingGB,
        percentUsed: updatedQuota.percentUsed,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
