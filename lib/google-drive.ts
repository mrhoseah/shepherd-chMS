import { google } from "googleapis";
import { Readable } from "stream";

/**
 * Google Drive Integration
 * Handles file uploads, downloads, and management in Google Drive
 */

// Initialize Google Drive client
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      project_id: process.env.GOOGLE_DRIVE_PROJECT_ID,
    },
    scopes: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.metadata",
    ],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Create a folder in Google Drive (if it doesn't exist)
 */
export async function getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
  const drive = getDriveClient();

  // Search for existing folder
  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  const existingFolders = await drive.files.list({
    q: query,
    fields: "files(id, name)",
  });

  if (existingFolders.data.files && existingFolders.data.files.length > 0) {
    return existingFolders.data.files[0].id!;
  }

  // Create folder if it doesn't exist
  const folderMetadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentFolderId) {
    folderMetadata.parents = [parentFolderId];
  }

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  });

  return folder.data.id!;
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
  const drive = getDriveClient();

  // Create file metadata
  const fileMetadata: any = {
    name: fileName,
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  // Convert buffer to stream
  const fileStream = Readable.from(fileBuffer);

  // Upload file
  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType,
      body: fileStream,
    },
    fields: "id, webViewLink, webContentLink",
  });

  // Make file accessible (optional - for public files)
  // await drive.permissions.create({
  //   fileId: file.data.id!,
  //   requestBody: {
  //     role: "reader",
  //     type: "anyone",
  //   },
  // });

  return {
    fileId: file.data.id!,
    webViewLink: file.data.webViewLink || "",
    webContentLink: file.data.webContentLink || "",
  };
}

/**
 * Get a file from Google Drive
 */
export async function getFileFromDrive(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();

  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}

/**
 * Get a shareable link for a file
 */
export async function getShareableLink(fileId: string, makePublic: boolean = false): Promise<string> {
  const drive = getDriveClient();

  if (makePublic) {
    // Make file publicly accessible
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  }

  // Get file metadata to get the link
  const file = await drive.files.get({
    fileId,
    fields: "webViewLink, webContentLink",
  });

  return file.data.webViewLink || file.data.webContentLink || "";
}

/**
 * Update file metadata in Google Drive
 */
export async function updateFileMetadata(
  fileId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  const drive = getDriveClient();

  await drive.files.update({
    fileId,
    requestBody: updates,
  });
}

/**
 * List files in a folder
 */
export async function listFilesInFolder(folderId: string): Promise<any[]> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, size, modifiedTime, webViewLink)",
  });

  return response.data.files || [];
}

