import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

export { cloudinary };

// Helper function to upload image
export async function uploadImage(
  file: Buffer | string,
  folder: string = "eastgatechapel",
  options: {
    public_id?: string;
    transformation?: any;
    resource_type?: "image" | "video" | "raw" | "auto";
  } = {}
) {
  try {
    let result;
    
    // If file is a Buffer, use upload_stream
    if (Buffer.isBuffer(file)) {
      result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: options.resource_type || "image",
            ...options,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file);
      });
    } else {
      // If file is a string (path or data URI), use upload
      result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: options.resource_type || "image",
        ...options,
      });
    }
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw new Error(error.message || "Failed to upload image to Cloudinary");
  }
}

// Helper function to delete image
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    throw new Error(error.message || "Failed to delete image from Cloudinary");
  }
}

