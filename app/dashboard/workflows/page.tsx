"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workflow, Plus, Play, Pause, Trash2, Edit, CheckCircle2, Clock, Mail, Bell, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: any;
  actions: any[];
  enabled: boolean;
  lastRun?: string;
  runCount: number;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "member_created",
    enabled: true,
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/workflows");
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Workflow name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const url = selectedWorkflow ? `/api/workflows/${selectedWorkflow.id}` : "/api/workflows";
      const method = selectedWorkflow ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Workflow ${selectedWorkflow ? "updated" : "created"} successfully`,
        });
        setIsDialogOpen(false);
        setSelectedWorkflow(null);
        setFormData({ name: "", description: "", trigger: "member_created", enabled: true });
        fetchWorkflows();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (response.ok) {
        fetchWorkflows();
      }
    } catch (error) {
      console.error("Error toggling workflow:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Workflow deleted successfully",
        });
        fetchWorkflows();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete workflow",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  const triggerOptions = [
    { value: "member_created", label: "New Member Registered" },
    { value: "member_inactive", label: "Member Becomes Inactive" },
    { value: "donation_received", label: "Donation Received" },
    { value: "event_created", label: "Event Created" },
    { value: "attendance_missed", label: "Member Misses Service" },
    { value: "birthday", label: "Member Birthday" },
    { value: "anniversary", label: "Member Anniversary" },
    { value: "guest_registered", label: "Guest Registered" },
  ];

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Workflow className="w-8 h-8" />
            Automated Workflows
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automate follow-ups, reminders, and communications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedWorkflow(null);
                setFormData({ name: "", description: "", trigger: "member_created", enabled: true });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedWorkflow ? "Edit Workflow" : "Create New Workflow"}
              </DialogTitle>
              <DialogDescription>
                Set up automated workflows to streamline your operations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome New Members"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="trigger">Trigger Event *</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value) => setFormData({ ...formData, trigger: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Enabled</Label>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Workflow"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading workflows...</div>
          ) : workflows.filter((w) => w.enabled).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                No active workflows. Create one to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows
                .filter((w) => w.enabled)
                .map((workflow) => (
                  <Card key={workflow.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <Badge variant="outline" className="mt-2">
                            {triggerOptions.find((t) => t.value === workflow.trigger)?.label}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(workflow.id, workflow.enabled)}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(workflow.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {workflow.description || "No description"}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Run {workflow.runCount} times</span>
                        </div>
                        {workflow.lastRun && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(workflow.lastRun).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {workflows.filter((w) => !w.enabled).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                No inactive workflows
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows
                .filter((w) => !w.enabled)
                .map((workflow) => (
                  <Card key={workflow.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <Badge variant="outline" className="mt-2">
                            {triggerOptions.find((t) => t.value === workflow.trigger)?.label}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(workflow.id, workflow.enabled)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(workflow.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {workflow.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Welcome New Members
                </CardTitle>
                <CardDescription>Send welcome email to new members</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFormData({
                      name: "Welcome New Members",
                      description: "Send welcome email to new members",
                      trigger: "member_created",
                      enabled: true,
                    });
                    setSelectedWorkflow(null);
                    setIsDialogOpen(true);
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Follow-up Inactive Members
                </CardTitle>
                <CardDescription>Reach out to members who haven't attended</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFormData({
                      name: "Follow-up Inactive Members",
                      description: "Reach out to members who haven't attended",
                      trigger: "member_inactive",
                      enabled: true,
                    });
                    setSelectedWorkflow(null);
                    setIsDialogOpen(true);
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Birthday Greetings
                </CardTitle>
                <CardDescription>Send birthday wishes to members</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFormData({
                      name: "Birthday Greetings",
                      description: "Send birthday wishes to members",
                      trigger: "birthday",
                      enabled: true,
                    });
                    setSelectedWorkflow(null);
                    setIsDialogOpen(true);
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

