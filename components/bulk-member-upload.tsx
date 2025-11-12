"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileText, Download, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadResult {
  success: boolean;
  message: string;
  results: {
    created: number;
    skipped: number;
    errors: Array<{
      row: number;
      email?: string;
      phone?: string;
      error: string;
    }>;
  };
}

export function BulkMemberUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/people/bulk", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || "Failed to upload file");
        if (data.errors) {
          // If there are validation errors, show them
          setResult({
            success: false,
            message: data.error,
            results: {
              created: data.validRows || 0,
              skipped: 0,
              errors: data.errors || [],
            },
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while uploading");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `FirstName,LastName,Email,Phone,Title,MiddleName,DateOfBirth,Profession,Address,City,County,State,Country,Residence,ZipCode,Role,Status,BaptismDate,DedicationDate,WeddingAnniversary,MemberSince
John,Doe,john.doe@example.com,+1234567890,Mr,Michael,1990-01-15,Engineer,123 Main St,New York,Manhattan,NY,USA,Apartment 4B,10001,MEMBER,ACTIVE,2010-06-15,,,
Jane,Smith,jane.smith@example.com,+1234567891,Ms,,1985-05-20,Teacher,456 Oak Ave,Los Angeles,LA,CA,USA,House,90001,MEMBER,ACTIVE,2008-03-20,2005-07-10,2012-08-15,2010-01-01`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "member_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setFile(null);
      setResult(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Member Registration</DialogTitle>
          <DialogDescription>
            Upload a CSV file to register multiple members at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CSV Format Requirements</CardTitle>
              <CardDescription>
                Your CSV file must include the following columns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>
                    <strong>Required:</strong> FirstName, LastName
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>
                    <strong>Optional:</strong> Email, Phone, Title, MiddleName, DateOfBirth,
                    Profession, Address, City, County, State, Country, Residence, ZipCode, Role,
                    Status, BaptismDate, DedicationDate, WeddingAnniversary, MemberSince
                  </span>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select CSV File</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span className="text-gray-400">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {result.results.created}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {result.results.skipped}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Skipped</div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {result.results.errors.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                  </div>
                </div>

                {result.results.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.results.errors.slice(0, 10).map((err, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded"
                        >
                          <strong>Row {err.row}:</strong> {err.error}
                          {err.email && ` (Email: ${err.email})`}
                          {err.phone && ` (Phone: ${err.phone})`}
                        </div>
                      ))}
                      {result.results.errors.length > 10 && (
                        <div className="text-xs text-gray-500">
                          ... and {result.results.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? "Uploading..." : "Upload & Import"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

