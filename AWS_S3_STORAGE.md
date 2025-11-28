# AWS S3 Storage Integration

## Overview
The Shepherd ChMS now uses AWS S3 for file storage with plan-based quota enforcement. Each church's storage is limited based on their subscription plan.

## Features
✅ **Plan-Based Storage Limits**: Automatically enforced based on subscription plan (5GB, 25GB, 100GB)
✅ **Quota Monitoring**: Real-time storage usage tracking with visual progress bars
✅ **File Organization**: Files organized by church and category in S3
✅ **Presigned URLs**: Secure temporary URLs for private file access
✅ **CloudFront Support**: Optional CDN for faster global file delivery
✅ **File Categorization**: Documents, Images, Videos, Audio, Attachments
✅ **Usage Breakdown**: Detailed statistics by file type
✅ **Soft Delete**: Files marked as deleted but retained for recovery
✅ **Admin Controls**: Full file management interface

## Database Schema

### StorageFile Model
Tracks all uploaded files with metadata:
```prisma
model StorageFile {
  id            String   @id @default(cuid())
  churchId      String
  fileName      String    // Unique file name in S3
  originalName  String    // Original uploaded name
  mimeType      String
  fileSize      BigInt    // Size in bytes
  s3Key         String    // S3 object key
  s3Bucket      String    // S3 bucket name
  url           String    // Access URL
  category      FileCategory
  entityType    String?   // Related entity (member, event, etc.)
  entityId      String?
  uploadedById  String
  isPublic      Boolean   @default(false)
  isDeleted     Boolean   @default(false)
  deletedAt     DateTime?
  metadata      Json?
  tags          String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### StorageUsage Model
Tracks aggregated storage usage per church:
```prisma
model StorageUsage {
  id            String   @id @default(cuid())
  churchId      String   @unique
  totalUsed     BigInt   @default(0)    // Total bytes used
  documentsUsed BigInt   @default(0)
  imagesUsed    BigInt   @default(0)
  videosUsed    BigInt   @default(0)
  otherUsed     BigInt   @default(0)
  totalFiles    Int      @default(0)
  quotaGB       Int      @default(5)     // From subscription plan
  lastCalculated DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## API Endpoints

### 1. Upload File
**POST** `/api/storage/upload`

Uploads a file to S3 with automatic quota checking.

**Request** (multipart/form-data):
```typescript
{
  file: File,
  category?: "DOCUMENT" | "IMAGE" | "VIDEO" | "AUDIO" | "PROFILE_PHOTO" | "LOGO" | "BANNER" | "ATTACHMENT" | "OTHER",
  entityType?: string,   // e.g., "member", "event"
  entityId?: string,     // ID of related entity
  isPublic?: boolean,    // Default: false
  tags?: string[]        // Searchable tags
}
```

**Response**:
```typescript
{
  success: true,
  file: {
    id: string,
    url: string,
    s3Key: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  },
  quota: {
    used: number,        // GB used
    total: number,       // Total GB quota
    remaining: number,   // GB remaining
    percentUsed: number
  }
}
```

**Error Responses**:
- `413`: Storage quota exceeded
- `401`: Unauthorized
- `404`: Church not found
- `400`: No file provided

### 2. List Files
**GET** `/api/storage/files`

List files with filtering and pagination.

**Query Parameters**:
```
?category=DOCUMENT
&entityType=member
&entityId=123
&search=report
&page=1
&limit=50
```

**Response**:
```typescript
{
  success: true,
  files: StorageFile[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  },
  quota: StorageUsage
}
```

### 3. Delete File
**DELETE** `/api/storage/files/:id`

Soft deletes a file (marks as deleted, updates usage).

**Permissions**: Admins, Pastors, or file uploader

**Response**:
```typescript
{
  success: true,
  message: "File deleted successfully"
}
```

### 4. Get Storage Usage
**GET** `/api/storage/usage`

Get detailed storage usage statistics.

**Response**:
```typescript
{
  success: true,
  usage: {
    quota: number,
    used: number,
    remaining: number,
    percentUsed: number,
    isOverQuota: boolean,
    totalFiles: number
  },
  breakdown: {
    documents: { size: string, sizeGB: number, files: number },
    images: { size: string, sizeGB: number, files: number },
    videos: { size: string, sizeGB: number, files: number },
    other: { size: string, sizeGB: number, files: number }
  },
  lastCalculated: string
}
```

### 5. Recalculate Usage
**POST** `/api/storage/usage`

Recalculates storage usage from actual files (admin only).

**Permissions**: SUPERADMIN, ADMIN

**Response**:
```typescript
{
  success: true,
  message: "Storage usage recalculated successfully",
  usage: StorageUsage
}
```

## Storage Library Functions

### `uploadFile(buffer, originalName, mimeType, options)`
Uploads a file to S3 with quota checking.

```typescript
import { uploadFile } from "@/lib/storage";

const result = await uploadFile(
  buffer,
  "document.pdf",
  "application/pdf",
  {
    churchId: "church_123",
    uploadedById: "user_456",
    category: "DOCUMENT",
    entityType: "member",
    entityId: "member_789",
    isPublic: false,
    tags: ["important", "2025"]
  }
);
```

### `checkStorageQuota(churchId)`
Check available storage for a church.

```typescript
import { checkStorageQuota } from "@/lib/storage";

const quota = await checkStorageQuota("church_123");
// {
//   quotaGB: 25,
//   usedBytes: 5368709120n,
//   usedGB: 5.00,
//   remainingGB: 20.00,
//   percentUsed: 20.00,
//   isOverQuota: false,
//   totalFiles: 150
// }
```

### `deleteFile(fileId, churchId)`
Delete a file from S3 and database.

```typescript
import { deleteFile } from "@/lib/storage";

await deleteFile("file_123", "church_456");
```

### `getDownloadUrl(fileId, expiresIn)`
Generate presigned URL for file download.

```typescript
import { getDownloadUrl } from "@/lib/storage";

const url = await getDownloadUrl("file_123", 3600); // 1 hour expiry
```

### `listFiles(churchId, options)`
List files with filtering.

```typescript
import { listFiles } from "@/lib/storage";

const result = await listFiles("church_123", {
  category: "DOCUMENT",
  search: "report",
  page: 1,
  limit: 20
});
```

### `updateStorageUsage(churchId)`
Recalculate storage usage.

```typescript
import { updateStorageUsage } from "@/lib/storage";

await updateStorageUsage("church_123");
```

## Environment Variables

Required in `.env`:

```bash
# AWS S3 Configuration
AWS_S3_BUCKET=shepherd-chms-storage
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=your-access-key-id
AWS_S3_SECRET_ACCESS_KEY=your-secret-access-key

# Optional: CloudFront CDN
AWS_CLOUDFRONT_DOMAIN=your-distribution.cloudfront.net
```

## AWS Setup

### 1. Create S3 Bucket
```bash
aws s3api create-bucket \
  --bucket shepherd-chms-storage \
  --region us-east-1
```

### 2. Enable Versioning (Optional)
```bash
aws s3api put-bucket-versioning \
  --bucket shepherd-chms-storage \
  --versioning-configuration Status=Enabled
```

### 3. Set CORS Policy
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourchurch.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 4. Create IAM User
Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::shepherd-chms-storage",
        "arn:aws:s3:::shepherd-chms-storage/*"
      ]
    }
  ]
}
```

### 5. Setup CloudFront (Optional)
1. Create CloudFront distribution
2. Set S3 bucket as origin
3. Enable caching
4. Add custom domain (optional)
5. Update `AWS_CLOUDFRONT_DOMAIN` in `.env`

## Subscription Plan Integration

Storage quotas are automatically synced with subscription plans:

| Plan | Storage Quota |
|------|---------------|
| Basic | 5 GB |
| Standard | 25 GB |
| Premium | 100 GB |

When a subscription changes:
```typescript
import { syncStorageQuota } from "@/lib/storage";

// After updating subscription
await syncStorageQuota(churchId);
```

## Admin UI

Access the storage management dashboard at `/dashboard/storage`

Features:
- 📊 Visual storage usage metrics
- 📁 File browser with search and filters
- ⬆️ Direct file upload
- 🗑️ File deletion with confirmation
- 📈 Usage breakdown by category
- ⚠️ Quota warnings (>80% usage)
- 🔄 Manual usage recalculation

## File Categories

- **PROFILE_PHOTO**: Member/user profile pictures
- **DOCUMENT**: PDF, Word, Excel files
- **PRESENTATION**: PowerPoint, slides
- **IMAGE**: Photos, graphics
- **VIDEO**: Video files
- **AUDIO**: Audio recordings
- **LOGO**: Church/ministry logos
- **BANNER**: Event banners, headers
- **ATTACHMENT**: Email attachments, misc files
- **OTHER**: Uncategorized files

## Security

- ✅ All uploads require authentication
- ✅ Files scoped to church (cross-church access blocked)
- ✅ Private files use presigned URLs (expire after 1 hour)
- ✅ Public files can use CloudFront CDN
- ✅ File deletion requires admin role or uploader ownership
- ✅ Quota enforcement prevents abuse

## Migration from Cloudinary

To migrate existing Cloudinary files:

1. Export file metadata from `lib/cloudinary.ts` usage
2. Download files from Cloudinary
3. Re-upload to S3 using `uploadFile()`
4. Update database references
5. Delete from Cloudinary

Helper script (create as `scripts/migrate-cloudinary-to-s3.ts`):

```typescript
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
import fetch from "node-fetch";

async function migrateCloudinaryToS3() {
  // Find records with Cloudinary URLs
  const records = await prisma.user.findMany({
    where: {
      profileImage: {
        contains: "cloudinary.com"
      }
    }
  });

  for (const user of records) {
    const response = await fetch(user.profileImage!);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const result = await uploadFile(
      buffer,
      "profile.jpg",
      "image/jpeg",
      {
        churchId: user.campus?.churchId!,
        uploadedById: user.id,
        category: "PROFILE_PHOTO",
        entityType: "user",
        entityId: user.id
      }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: result.url }
    });
  }
}
```

## Troubleshooting

### Quota Exceeded
- Check `/dashboard/storage` for usage
- Delete unused files
- Upgrade subscription plan
- Recalculate usage (may be stale)

### Upload Fails
- Verify AWS credentials
- Check S3 bucket permissions
- Ensure bucket exists
- Check file size limits

### Presigned URLs Expired
- URLs expire after 1 hour by default
- Generate new URL using `getDownloadUrl()`
- Consider making files public if appropriate

## Performance Tips

1. **Use CloudFront**: Dramatically improves download speeds globally
2. **Compress Images**: Before uploading large images
3. **Set Appropriate Expiry**: Longer for public, shorter for private
4. **Batch Operations**: Upload multiple files in parallel
5. **Monitor Usage**: Regular cleanup of old files

## Future Enhancements

- [ ] Automatic image optimization/resizing
- [ ] Video transcoding
- [ ] Bulk upload interface
- [ ] File versioning
- [ ] Trash/recycle bin (30-day retention)
- [ ] File sharing with expiring links
- [ ] Advanced search with metadata
- [ ] Usage analytics dashboard
- [ ] Automatic backup to secondary region
- [ ] File virus scanning integration
