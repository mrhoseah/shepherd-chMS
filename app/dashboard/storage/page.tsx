"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  RefreshCw,
  HardDrive,
  Search,
  Download,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface StorageFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: bigint;
  category: string;
  url: string;
  createdAt: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface StorageUsage {
  quota: number;
  used: number;
  remaining: number;
  percentUsed: number;
  isOverQuota: boolean;
  totalFiles: number;
}

interface StorageBreakdown {
  documents: { size: string; sizeGB: number; files: number };
  images: { size: string; sizeGB: number; files: number };
  videos: { size: string; sizeGB: number; files: number };
  other: { size: string; sizeGB: number; files: number };
}

export default function StorageManagementPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch storage usage
  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/storage/usage");
      const data = await response.json();

      if (data.success) {
        setUsage(data.usage);
        setBreakdown(data.breakdown);
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  };

  // Fetch files
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (categoryFilter && categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/storage/files?${params}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setTotalPages(data.pagination.totalPages);
        setUsage(data.quota);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "DOCUMENT");
      formData.append("isPublic", "false");

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
        fetchFiles();
        fetchUsage();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Delete file
  const handleDelete = async (fileId: string) => {
    setDeleting(fileId);
    try {
      const response = await fetch(`/api/storage/files/${fileId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
        fetchFiles();
        fetchUsage();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
      setFileToDelete(null);
    }
  };

  // Recalculate usage
  const handleRecalculate = async () => {
    try {
      const response = await fetch("/api/storage/usage", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Storage usage recalculated",
        });
        fetchUsage();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate usage",
        variant: "destructive",
      });
    }
  };

  // Get file icon
  const getFileIcon = (mimeType: string, category: string) => {
    if (category === "DOCUMENT" || mimeType.includes("pdf")) {
      return <FileText className="h-4 w-4" />;
    }
    if (category === "IMAGE" || mimeType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    if (category === "VIDEO" || mimeType.startsWith("video/")) {
      return <Video className="h-4 w-4" />;
    }
    if (category === "AUDIO" || mimeType.startsWith("audio/")) {
      return <Music className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: bigint | number) => {
    const size = typeof bytes === "bigint" ? Number(bytes) : bytes;
    if (size >= 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (size >= 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    }
    return `${size} B`;
  };

  useEffect(() => {
    fetchFiles();
    fetchUsage();
  }, [page, categoryFilter, searchQuery]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Storage Management</h1>
        <p className="text-muted-foreground">
          Manage your church's file storage and monitor usage
        </p>
      </div>

      {/* Storage Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage?.used.toFixed(2)} GB
            </div>
            <p className="text-xs text-muted-foreground">
              of {usage?.quota} GB quota
            </p>
            <Progress
              value={usage?.percentUsed || 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage?.totalFiles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {usage?.remaining.toFixed(2)} GB remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{breakdown?.documents.files || 0}</div>
            <p className="text-xs text-muted-foreground">
              {breakdown?.documents.size || "0 KB"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{breakdown?.images.files || 0}</div>
            <p className="text-xs text-muted-foreground">
              {breakdown?.images.size || "0 KB"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Warning */}
      {usage && usage.percentUsed > 80 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Storage Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You're using {usage.percentUsed.toFixed(1)}% of your storage quota.
              {usage.isOverQuota
                ? " Your storage quota has been exceeded. Please delete some files or upgrade your plan."
                : " Consider upgrading your plan or deleting unused files."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>Browse and manage uploaded files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="DOCUMENT">Documents</SelectItem>
                <SelectItem value="IMAGE">Images</SelectItem>
                <SelectItem value="VIDEO">Videos</SelectItem>
                <SelectItem value="AUDIO">Audio</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleRecalculate} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>

            <label>
              <Button disabled={uploading || usage?.isOverQuota}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading || usage?.isOverQuota}
              />
            </label>
          </div>

          {/* Files Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No files found
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.mimeType, file.category)}
                          <span className="font-medium truncate max-w-[200px]">
                            {file.originalName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{file.category}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {file.uploadedBy.firstName} {file.uploadedBy.lastName}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {file.uploadedBy.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(file.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setFileToDelete(file)}
                            disabled={deleting === file.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.originalName}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDelete(fileToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
