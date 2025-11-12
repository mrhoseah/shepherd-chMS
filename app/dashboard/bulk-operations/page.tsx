"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Mail,
  Tag,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Building2,
  UserCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BulkOperationsPage() {
  const [activeTab, setActiveTab] = useState("members");
  const [loading, setLoading] = useState(false);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: "all",
    role: "all",
    campusId: "",
  });
  const [operationData, setOperationData] = useState<any>({});
  const { toast } = useToast();

  const handleOperation = (operation: string, entityType: string) => {
    setCurrentOperation({ operation, entityType });
    setOperationDialogOpen(true);
  };

  const executeOperation = async () => {
    if (!currentOperation) return;

    setLoading(true);
    try {
      const response = await fetch("/api/bulk-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: currentOperation.operation,
          target: selectedMembers.length > 0 ? "selected" : "all",
          entityType: currentOperation.entityType,
          filters: selectedMembers.length > 0 
            ? { ids: selectedMembers } 
            : {
                ...filters,
                status: filters.status === "all" ? undefined : filters.status,
                role: filters.role === "all" ? undefined : filters.role,
              },
          data: operationData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: result.affected
            ? `Operation completed. ${result.affected} records affected.`
            : `Operation completed successfully.`,
        });
        setOperationDialogOpen(false);
        setCurrentOperation(null);
        setOperationData({});
        setSelectedMembers([]);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to perform bulk operation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk operation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/bulk-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "export",
          target: "all",
          entityType: type,
          filters: {},
        }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Convert to CSV
        const headers = Object.keys(result.data[0] || {});
        const rows = result.data.map((item: any) =>
          headers.map((header) => {
            const value = item[header];
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value);
            return String(value);
          })
        );

        const csvContent = [
          headers.join(","),
          ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: `Exported ${result.count} ${type}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOperationDialog = () => {
    if (!currentOperation) return null;

    const { operation, entityType } = currentOperation;

    return (
      <Dialog open={operationDialogOpen} onOpenChange={setOperationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {operation === "status" && "Update Status"}
              {operation === "role" && "Update Role"}
              {operation === "group" && "Assign to Group"}
              {operation === "email" && "Send Email"}
              {operation === "sms" && "Send SMS"}
              {operation === "tag" && "Add Tag"}
              {operation === "campus" && "Assign Campus"}
              {operation === "delete" && "Delete Members"}
            </DialogTitle>
            <DialogDescription>
              {selectedMembers.length > 0
                ? `This will affect ${selectedMembers.length} selected ${entityType}`
                : `This will affect all ${entityType} matching the filters`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {operation === "status" && (
              <div>
                <Label>New Status</Label>
                <Select
                  value={operationData.status || ""}
                  onValueChange={(value) =>
                    setOperationData({ ...operationData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {operation === "role" && (
              <div>
                <Label>New Role</Label>
                <Select
                  value={operationData.role || ""}
                  onValueChange={(value) =>
                    setOperationData({ ...operationData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="GUEST">Guest</SelectItem>
                    <SelectItem value="LEADER">Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {operation === "tag" && (
              <div>
                <Label>Tag Name</Label>
                <Input
                  value={operationData.tag || ""}
                  onChange={(e) =>
                    setOperationData({ ...operationData, tag: e.target.value })
                  }
                  placeholder="Enter tag name"
                />
              </div>
            )}

            {operation === "email" && (
              <>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={operationData.subject || ""}
                    onChange={(e) =>
                      setOperationData({ ...operationData, subject: e.target.value })
                    }
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={operationData.body || ""}
                    onChange={(e) =>
                      setOperationData({ ...operationData, body: e.target.value })
                    }
                    placeholder="Email message"
                    rows={5}
                  />
                </div>
              </>
            )}

            {operation === "sms" && (
              <div>
                <Label>Message</Label>
                <Textarea
                  value={operationData.message || ""}
                  onChange={(e) =>
                    setOperationData({ ...operationData, message: e.target.value })
                  }
                  placeholder="SMS message (160 characters max)"
                  rows={4}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {operationData.message?.length || 0}/160 characters
                </p>
              </div>
            )}

            {operation === "delete" && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100">
                      Warning: This action cannot be undone
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                      Only GUEST role members can be deleted in bulk. This will permanently
                      remove the selected members from the system.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOperationDialogOpen(false);
                setOperationData({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={executeOperation}
              disabled={loading || (operation === "delete" && !operationData.confirm)}
              variant={operation === "delete" ? "destructive" : "default"}
            >
              {loading ? "Processing..." : "Execute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bulk Operations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Perform operations on multiple records at once
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Member Operations
              </CardTitle>
              <CardDescription>
                Select members and perform bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={filters.role}
                    onValueChange={(value) => setFilters({ ...filters, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="GUEST">Guest</SelectItem>
                      <SelectItem value="LEADER">Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ status: "all", role: "all", campusId: "" })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              {selectedMembers.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedMembers.length} member(s) selected
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedMembers([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}

              {/* Operation Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleOperation("status", "members")}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleOperation("role", "members")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Update Role
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleOperation("tag", "members")}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Add Tag
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleOperation("group", "members")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign to Group
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleOperation("campus", "members")}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Assign Campus
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-red-600 hover:text-red-700"
                  onClick={() => handleOperation("delete", "members")}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete (Guests Only)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export
              </CardTitle>
              <CardDescription>Export data in CSV format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExport("members")}
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Members (CSV)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExport("donations")}
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Donations (CSV)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExport("events")}
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Events (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Bulk Communication
              </CardTitle>
              <CardDescription>Send messages to multiple members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOperation("email", "members")}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOperation("sms", "members")}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderOperationDialog()}
    </div>
  );
}
