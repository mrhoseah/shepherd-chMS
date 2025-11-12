import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  uploadFileToDrive,
  getOrCreateFolder,
  deleteFileFromDrive,
  getShareableLink,
} from "@/lib/google-drive";

/**
 * Document Management API
 * Optimized with:
 * - O(log n) database queries with indexes
 * - Efficient file storage
 * - Proper error handling
 */

// Map category strings to DocumentType enum
const categoryToType: Record<string, string> = {
  sermons: "OTHER",
  bulletins: "REPORT",
  forms: "FORM",
  policies: "POLICY",
  reports: "REPORT",
  other: "OTHER",
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || "all";

    // Build where clause - O(log n) with index on category
    const where: any = {};
    if (category !== "all") {
      where.category = category;
    }

    // Optionally filter by church if needed
    // where.churchId = churchId;

    // Fetch documents - O(log n) with indexes on category and churchId
    const documents = await prisma.document.findMany({
      where,
      take: 100, // Limit for performance
      orderBy: { createdAt: "desc" },
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

    const formatted = documents.map((doc) => ({
      id: doc.id,
      name: doc.title,
      type: doc.mimeType?.split("/")[1]?.toUpperCase() || "FILE",
      size: doc.fileSize ? Number(doc.fileSize) : 0,
      category: doc.category || "other",
      uploadedBy: `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`,
      uploadedAt: doc.createdAt.toISOString(),
      url: doc.fileUrl,
      description: doc.description,
    }));

    return NextResponse.json({ documents: formatted });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;

    if (!file || !name || !category) {
      return NextResponse.json(
        { error: "File, name, and category are required" },
        { status: 400 }
      );
    }

    // Get user's church - get from user's campus or find first active church
    let churchId: string;
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { 
          campusId: true, 
          campus: { 
            select: { 
              churchId: true 
            } 
          } 
        },
      });

      if (user?.campus?.churchId) {
        churchId = user.campus.churchId;
      } else {
        // Fallback: get first active church
        const church = await prisma.church.findFirst({
          where: { isActive: true },
          select: { id: true },
        });
        churchId = church?.id || "default-church-id";
      }
    } catch (error) {
      // If error, try to get first church
      try {
        const church = await prisma.church.findFirst({
          select: { id: true },
        });
        churchId = church?.id || "default-church-id";
      } catch {
        churchId = "default-church-id";
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine file type
    const mimeType = file.type || "application/octet-stream";
    const fileExtension = file.name.split(".").pop() || "bin";

    // Upload to Google Drive
    let fileUrl: string;
    let googleDriveFileId: string | null = null;

    try {
      // Get or create church documents folder
      const churchFolderName = `Church-${churchId}-Documents`;
      const churchFolderId = await getOrCreateFolder(churchFolderName);

      // Get or create category folder within church folder
      const categoryFolderId = await getOrCreateFolder(category, churchFolderId);

      // Generate unique file name
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      // Upload to Google Drive
      const driveResult = await uploadFileToDrive(
        buffer,
        fileName,
        mimeType,
        categoryFolderId
      );

      googleDriveFileId = driveResult.fileId;
      
      // Get shareable link
      fileUrl = await getShareableLink(driveResult.fileId, false);
      
      // If we couldn't get a shareable link, use the webViewLink
      if (!fileUrl && driveResult.webViewLink) {
        fileUrl = driveResult.webViewLink;
      }
    } catch (driveError: any) {
      console.error("Error uploading to Google Drive:", driveError);
      
      // Fallback to local storage if Google Drive fails
      const { writeFile, mkdir } = await import("fs/promises");
      const { join } = await import("path");
      const { existsSync } = await import("fs");
      
      const uploadsDir = join(process.cwd(), "public", "uploads", "documents");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      fileUrl = `/uploads/documents/${fileName}`;
      
      console.warn("Fell back to local storage due to Google Drive error");
    }

    // Map category to DocumentType
    const documentType = categoryToType[category] || "OTHER";

    // Save to database - O(1) insert
    // Store Google Drive file ID in metadata if available
    const document = await prisma.document.create({
      data: {
        title: name,
        description: `Uploaded document in ${category} category${googleDriveFileId ? ` (Google Drive ID: ${googleDriveFileId})` : ""}`,
        type: documentType as any,
        category,
        fileUrl,
        fileSize: BigInt(file.size),
        mimeType,
        uploadedById: session.user.id,
        churchId,
        isPublic: false,
        accessLevel: "private",
        // Store Google Drive file ID in a way we can retrieve it
        // Note: If your schema has a metadata field, use that instead
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        name: document.title,
        category: document.category,
        size: Number(document.fileSize),
        type: mimeType.split("/")[1]?.toUpperCase() || "FILE",
        url: document.fileUrl,
      },
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}
