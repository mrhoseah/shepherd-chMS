"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";

interface CloudinaryUploadProps {
  folder?: string;
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string | null;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function CloudinaryUpload({
  folder = "eastgatechapel",
  onUploadComplete,
  currentImageUrl,
  label = "Upload Image",
  accept = "image/*",
  maxSizeMB = 10,
}: CloudinaryUploadProps) {
  const { data: session, status } = useSession();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError("");
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    // Wait for session to load if it's still loading
    if (status === "loading") {
      setError("Please wait while we verify your session...");
      return;
    }

    // Check session, but also let the API handle authentication
    // The API will return 401 if not authenticated, which we'll handle below
    if (status === "unauthenticated") {
      setError("You must be logged in to upload images. Please refresh the page and try again.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle authentication errors specifically
        if (res.status === 401) {
          throw new Error("You must be logged in to upload images. Please refresh the page and log in again.");
        }
        throw new Error(data.error || "Failed to upload image");
      }

      setPreview(data.url);
      onUploadComplete(data.url);
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload image");
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-upload">{label}</Label>
        <div className="mt-2 flex items-center gap-4">
          <Input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || status === "loading"}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </>
            )}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Max file size: {maxSizeMB}MB. Supported formats: JPG, PNG, GIF, WebP
        </p>
      </div>

      {preview && (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {!preview && !uploading && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No image selected
          </p>
        </div>
      )}
    </div>
  );
}

