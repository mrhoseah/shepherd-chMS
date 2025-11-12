"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CloudinaryUpload } from "@/components/cloudinary-upload";

interface FamilyPhotoUploadProps {
  userId: string;
  currentPhoto?: string | null;
}

export function FamilyPhotoUpload({
  userId,
  currentPhoto,
}: FamilyPhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhoto || "");
  const router = useRouter();

  const handleUploadComplete = async (url: string) => {
    setPhotoUrl(url);
    if (url) {
      // Auto-save when upload completes
      await handleSave(url);
    }
  };

  const handleSave = async (urlToSave: string | null = photoUrl || null) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/people/${userId}/family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyPhoto: urlToSave || null,
        }),
      });

      if (res.ok) {
        setOpen(false);
        setPhotoUrl("");
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update family photo");
      }
    } catch (error) {
      console.error("Error updating family photo:", error);
      alert("Failed to update family photo");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove the family photo?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/people/${userId}/family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyPhoto: null,
        }),
      });

      if (res.ok) {
        setPhotoUrl("");
        setOpen(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to remove family photo");
      }
    } catch (error) {
      console.error("Error removing family photo:", error);
      alert("Failed to remove family photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="w-4 h-4 mr-2" />
          {currentPhoto ? "Update Photo" : "Add Photo"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Family Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <CloudinaryUpload
            folder="family-photos"
            onUploadComplete={handleUploadComplete}
            currentImageUrl={currentPhoto}
            label="Upload Family Photo"
            maxSizeMB={10}
          />

          {currentPhoto && (
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Family Photo
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setPhotoUrl(currentPhoto || "");
              }}
            >
              Close
            </Button>
            {photoUrl && photoUrl !== currentPhoto && (
              <Button
                type="button"
                onClick={() => handleSave()}
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

