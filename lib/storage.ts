import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "./prisma";
import crypto from "crypto";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || "shepherd-chms-storage";
const CLOUDFRONT_URL = process.env.AWS_CLOUDFRONT_URL; // Optional CloudFront distribution

export interface UploadOptions {
  churchId: string;
  uploadedById: string;
  category?: "PROFILE_PHOTO" | "DOCUMENT" | "PRESENTATION" | "IMAGE" | "VIDEO" | "AUDIO" | "ATTACHMENT" | "LOGO" | "BANNER" | "OTHER";
  entityType?: string;
  entityId?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface StorageQuota {
  quotaGB: number;
  usedBytes: bigint;
  usedGB: number;
  remainingGB: number;
  percentUsed: number;
  isOverQuota: boolean;
  totalFiles: number;
}

/**
 * Check storage quota for a church
 */
export async function checkStorageQuota(churchId: string): Promise<StorageQuota> {
  // Get church subscription to determine quota
  const subscription = await prisma.subscription.findUnique({
    where: { churchId },
    select: { maxStorage: true },
  });

  // Get or create storage usage record
  let storageUsage = await prisma.storageUsage.findUnique({
    where: { churchId },
  });

  if (!storageUsage) {
    // Create initial storage usage record
    storageUsage = await prisma.storageUsage.create({
      data: {
        churchId,
        quotaGB: subscription?.maxStorage || 5, // Default 5GB
        totalUsed: BigInt(0),
        totalFiles: 0,
      },
    });
  }

  const quotaBytes = BigInt(storageUsage.quotaGB) * BigInt(1024 * 1024 * 1024); // Convert GB to bytes
  const usedBytes = storageUsage.totalUsed;
  const usedGB = Number(usedBytes) / (1024 * 1024 * 1024);
  const remainingGB = storageUsage.quotaGB - usedGB;
  const percentUsed = (Number(usedBytes) / Number(quotaBytes)) * 100;
  const isOverQuota = usedBytes >= quotaBytes;

  return {
    quotaGB: storageUsage.quotaGB,
    usedBytes,
    usedGB: Math.round(usedGB * 100) / 100,
    remainingGB: Math.round(remainingGB * 100) / 100,
    percentUsed: Math.round(percentUsed * 100) / 100,
    isOverQuota,
    totalFiles: storageUsage.totalFiles,
  };
}

/**
 * Upload file to S3 with quota checking
 */
export async function uploadFile(
  file: Buffer,
  originalName: string,
  mimeType: string,
  options: UploadOptions
) {
  const { churchId, uploadedById, category = "OTHER", entityType, entityId, isPublic = false, metadata, tags } = options;

  // Check storage quota before upload
  const quota = await checkStorageQuota(churchId);
  const fileSizeBytes = BigInt(file.length);
  const fileSizeGB = Number(fileSizeBytes) / (1024 * 1024 * 1024);

  if (quota.isOverQuota) {
    throw new Error(`Storage quota exceeded. You have used ${quota.usedGB}GB of ${quota.quotaGB}GB.`);
  }

  if (quota.remainingGB < fileSizeGB) {
    throw new Error(
      `File size (${fileSizeGB.toFixed(2)}GB) exceeds remaining storage (${quota.remainingGB.toFixed(2)}GB).`
    );
  }

  // Generate unique file key
  const fileExt = originalName.split(".").pop();
  const fileName = `${crypto.randomBytes(16).toString("hex")}.${fileExt}`;
  const s3Key = `churches/${churchId}/${category.toLowerCase()}/${fileName}`;

  try {
    // Upload to S3 using multipart upload for large files
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: file,
        ContentType: mimeType,
        Metadata: metadata || {},
        ...(isPublic && { ACL: "public-read" }),
      },
    });

    await upload.done();

    // Generate file URL (CloudFront if available, otherwise S3)
    let fileUrl: string;
    if (CLOUDFRONT_URL) {
      fileUrl = `${CLOUDFRONT_URL}/${s3Key}`;
    } else if (isPublic) {
      fileUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${s3Key}`;
    } else {
      // Generate presigned URL for private files (expires in 1 hour)
      fileUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
        }),
        { expiresIn: 3600 }
      );
    }

    // Save file record to database
    const storageFile = await prisma.storageFile.create({
      data: {
        churchId,
        fileName,
        originalName,
        mimeType,
        fileSize: fileSizeBytes,
        s3Key,
        s3Bucket: S3_BUCKET,
        url: fileUrl,
        category,
        entityType,
        entityId,
        uploadedById,
        isPublic,
        metadata: metadata || {},
        tags: tags || [],
      },
    });

    // Update storage usage
    await updateStorageUsage(churchId);

    return {
      id: storageFile.id,
      url: fileUrl,
      s3Key,
      fileName,
      fileSize: Number(fileSizeBytes),
      mimeType,
    };
  } catch (error: any) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Get presigned URL for downloading a file
 */
export async function getDownloadUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
  const file = await prisma.storageFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new Error("File not found");
  }

  if (file.isDeleted) {
    throw new Error("File has been deleted");
  }

  // If file is public and CloudFront is available, return CloudFront URL
  if (file.isPublic && CLOUDFRONT_URL) {
    return `${CLOUDFRONT_URL}/${file.s3Key}`;
  }

  // Generate presigned URL for private files
  const command = new GetObjectCommand({
    Bucket: file.s3Bucket,
    Key: file.s3Key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete file from S3 and database
 */
export async function deleteFile(fileId: string, churchId: string): Promise<void> {
  const file = await prisma.storageFile.findFirst({
    where: {
      id: fileId,
      churchId,
      isDeleted: false,
    },
  });

  if (!file) {
    throw new Error("File not found or already deleted");
  }

  try {
    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: file.s3Bucket,
        Key: file.s3Key,
      })
    );

    // Mark as deleted in database (soft delete)
    await prisma.storageFile.update({
      where: { id: fileId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Update storage usage
    await updateStorageUsage(churchId);
  } catch (error: any) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Update storage usage statistics for a church
 */
export async function updateStorageUsage(churchId: string): Promise<void> {
  // Calculate total usage from active files
  const stats = await prisma.storageFile.aggregate({
    where: {
      churchId,
      isDeleted: false,
    },
    _sum: {
      fileSize: true,
    },
    _count: {
      id: true,
    },
  });

  // Get category breakdowns
  const categories = await prisma.storageFile.groupBy({
    by: ["category"],
    where: {
      churchId,
      isDeleted: false,
    },
    _sum: {
      fileSize: true,
    },
  });

  // Map categories to storage usage fields
  const documentsUsed = categories.find((c) => c.category === "DOCUMENT")?._sum.fileSize || BigInt(0);
  const imagesUsed =
    (categories.find((c) => c.category === "IMAGE")?._sum.fileSize || BigInt(0)) +
    (categories.find((c) => c.category === "PROFILE_PHOTO")?._sum.fileSize || BigInt(0)) +
    (categories.find((c) => c.category === "LOGO")?._sum.fileSize || BigInt(0)) +
    (categories.find((c) => c.category === "BANNER")?._sum.fileSize || BigInt(0));
  const videosUsed = categories.find((c) => c.category === "VIDEO")?._sum.fileSize || BigInt(0);
  const otherUsed =
    (categories.find((c) => c.category === "OTHER")?._sum.fileSize || BigInt(0)) +
    (categories.find((c) => c.category === "AUDIO")?._sum.fileSize || BigInt(0)) +
    (categories.find((c) => c.category === "ATTACHMENT")?._sum.fileSize || BigInt(0)) +
    (categories.find((c) => c.category === "PRESENTATION")?._sum.fileSize || BigInt(0));

  // Get current subscription quota
  const subscription = await prisma.subscription.findUnique({
    where: { churchId },
    select: { maxStorage: true },
  });

  // Update or create storage usage record
  await prisma.storageUsage.upsert({
    where: { churchId },
    update: {
      totalUsed: stats._sum.fileSize || BigInt(0),
      documentsUsed,
      imagesUsed,
      videosUsed,
      otherUsed,
      totalFiles: stats._count.id,
      lastCalculated: new Date(),
    },
    create: {
      churchId,
      totalUsed: stats._sum.fileSize || BigInt(0),
      documentsUsed,
      imagesUsed,
      videosUsed,
      otherUsed,
      totalFiles: stats._count.id,
      quotaGB: subscription?.maxStorage || 5,
      lastCalculated: new Date(),
    },
  });
}

/**
 * List files for a church with pagination
 */
export async function listFiles(
  churchId: string,
  options?: {
    category?: string;
    entityType?: string;
    entityId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const { category, entityType, entityId, search, page = 1, limit = 50 } = options || {};

  const where: any = {
    churchId,
    isDeleted: false,
  };

  if (category) where.category = category;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (search) {
    where.OR = [{ originalName: { contains: search, mode: "insensitive" } }, { tags: { has: search } }];
  }

  const [files, total] = await Promise.all([
    prisma.storageFile.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.storageFile.count({ where }),
  ]);

  return {
    files,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get file metadata
 */
export async function getFileMetadata(fileId: string) {
  return await prisma.storageFile.findUnique({
    where: { id: fileId },
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
}

/**
 * Sync subscription quota with storage usage
 * Call this when subscription changes
 */
export async function syncStorageQuota(churchId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { churchId },
    select: { maxStorage: true },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  await prisma.storageUsage.upsert({
    where: { churchId },
    update: {
      quotaGB: subscription.maxStorage || 5,
    },
    create: {
      churchId,
      quotaGB: subscription.maxStorage || 5,
      totalUsed: BigInt(0),
      totalFiles: 0,
    },
  });
}
