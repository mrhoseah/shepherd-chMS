"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MediaInsertionProps {
  onInsert: (media: { src: string; type: "image" | "video"; x: number; y: number; width: number; height: number }) => void;
  containerWidth: number;
  containerHeight: number;
}

export function MediaInsertion({ onInsert, containerWidth, containerHeight }: MediaInsertionProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (mediaType === "image" && !file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (mediaType === "video" && !file.type.startsWith("video/")) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 50MB for videos, 10MB for images)
    const maxSize = mediaType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `File size must be less than ${mediaType === "video" ? "50MB" : "10MB"}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      if (mediaType === "image") {
        // Upload image to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "eastgatechapel/presentations");

        const res = await fetch("/api/upload/cloudinary", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to upload image");
        }

        setPreview(data.url);
        
        // Insert media at center of container
        const defaultWidth = Math.min(300, containerWidth * 0.4);
        const defaultHeight = mediaType === "image" ? defaultWidth : defaultWidth * 0.75;
        const x = (containerWidth - defaultWidth) / 2;
        const y = (containerHeight - defaultHeight) / 2;

        onInsert({
          src: data.url,
          type: "image",
          x,
          y,
          width: defaultWidth,
          height: defaultHeight,
        });

        setOpen(false);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        // For videos, create object URL (or upload to Cloudinary if needed)
        const videoUrl = URL.createObjectURL(file);
        setPreview(videoUrl);
        
        const defaultWidth = Math.min(400, containerWidth * 0.5);
        const defaultHeight = defaultWidth * 0.75;
        const x = (containerWidth - defaultWidth) / 2;
        const y = (containerHeight - defaultHeight) / 2;

        onInsert({
          src: videoUrl,
          type: "video",
          x,
          y,
          width: defaultWidth,
          height: defaultHeight,
        });

        setOpen(false);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <ImageIcon className="w-4 h-4" />
        Insert Media
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Media</DialogTitle>
            <DialogDescription>
              Upload an image or video to add to your slide
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Media type selection */}
            <div className="flex gap-2">
              <Button
                variant={mediaType === "image" ? "default" : "outline"}
                onClick={() => {
                  setMediaType("image");
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="flex-1"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button
                variant={mediaType === "video" ? "default" : "outline"}
                onClick={() => {
                  setMediaType("video");
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="flex-1"
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>

            {/* File input */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === "image" ? "image/*" : "video/*"}
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
              />
              <label
                htmlFor="media-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {mediaType === "image" ? (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  ) : (
                    <Video className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Click to upload {mediaType === "image" ? "an image" : "a video"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {mediaType === "image" ? "PNG, JPG, GIF up to 10MB" : "MP4, WebM up to 50MB"}
                  </p>
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                )}
              </label>
            </div>

            {/* Preview */}
            {preview && (
              <div className="relative">
                <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {mediaType === "image" ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video
                      src={preview}
                      className="w-full h-full object-contain"
                      controls
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

