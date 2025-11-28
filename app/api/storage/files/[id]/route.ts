import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const fileId = params.id;

    // Verify file belongs to church
    const file = await prisma.storageFile.findFirst({
      where: {
        id: fileId,
        churchId,
        isDeleted: false,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check permissions (only admins or the uploader can delete)
    const canDelete =
      ["SUPERADMIN", "ADMIN", "PASTOR"].includes(user.role) ||
      file.uploadedById === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this file" },
        { status: 403 }
      );
    }

    // Delete file
    await deleteFile(fileId, churchId);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
