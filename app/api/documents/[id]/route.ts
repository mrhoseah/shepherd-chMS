import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromDrive } from "@/lib/google-drive";
import { unlink } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get document first to check permissions and get file path
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user has permission (uploader or admin)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (document.uploadedById !== session.user.id && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from storage (Google Drive or local filesystem)
    try {
      // Check if it's a Google Drive file (stored in description or fileUrl contains drive.google.com)
      const isGoogleDriveFile = 
        document.description?.includes("Google Drive ID:") ||
        document.fileUrl.includes("drive.google.com") ||
        document.fileUrl.includes("docs.google.com");

      if (isGoogleDriveFile) {
        // Extract Google Drive file ID from description or URL
        const driveIdMatch = document.description?.match(/Google Drive ID: ([a-zA-Z0-9_-]+)/);
        if (driveIdMatch && driveIdMatch[1]) {
          await deleteFileFromDrive(driveIdMatch[1]);
        } else {
          // Try to extract from URL
          const urlMatch = document.fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (urlMatch && urlMatch[1]) {
            await deleteFileFromDrive(urlMatch[1]);
          }
        }
      } else if (document.fileUrl.startsWith("/uploads/")) {
        // Delete from local filesystem
        const filePath = join(process.cwd(), "public", document.fileUrl);
        await unlink(filePath).catch(() => {
          // File might not exist, that's okay
        });
      }
    } catch (fileError) {
      // Continue even if file deletion fails
      console.log("Could not delete file:", fileError);
    }

    // Delete from database - O(1) with primary key
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
