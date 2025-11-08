"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Edit, Trash2, Mail, MessageSquare, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AITemplateGenerator } from "@/components/ai-template-generator";

interface Template {
  id: string;
  name: string;
  category: string;
  type: string;
  subject?: string;
  content: string;
  trigger?: string;
  isActive: boolean;
  isDefault: boolean;
}

const categories = [
  "PAYMENT_CONFIRMATION",
  "DONATION_RECEIPT",
  "PAYPAL_RECEIPT",
  "MPESA_RECEIPT",
  "WELCOME",
  "EVENT_REMINDER",
  "BIRTHDAY",
  "ANNIVERSARY",
  "WEDDING_ANNIVERSARY",
  "THANK_YOU",
  "APPRECIATION",
  "PRAYER_REQUEST",
  "FOLLOW_UP",
  "GENERAL",
];

const types = ["EMAIL", "SMS", "PUSH", "IN_APP"];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "GENERAL",
    type: "EMAIL",
    subject: "",
    content: "",
    trigger: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : "/api/templates";
      const method = editingTemplate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setOpen(false);
        setEditingTemplate(null);
        setFormData({
          name: "",
          category: "GENERAL",
          type: "EMAIL",
          subject: "",
          content: "",
          trigger: "",
          isDefault: false,
        });
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      type: template.type,
      subject: template.subject || "",
      content: template.content,
      trigger: template.trigger || "",
      isDefault: template.isDefault,
    });
    setOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "EMAIL":
        return <Mail className="w-4 h-4" />;
      case "SMS":
        return <MessageSquare className="w-4 h-4" />;
      case "PUSH":
        return <Bell className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Message Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage automated message templates with categories</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              style={{ backgroundColor: "#1E40AF" }}
              onClick={() => {
                setEditingTemplate(null);
                setFormData({
                  name: "",
                  category: "GENERAL",
                  type: "EMAIL",
                  subject: "",
                  content: "",
                  trigger: "",
                  isDefault: false,
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create Template"}
              </DialogTitle>
              <DialogDescription>
                Create message templates with variables like {"{{amount}}"}, {"{{donorName}}"}, {"{{transactionId}}"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === "EMAIL" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="subject">Subject</Label>
                    <AITemplateGenerator
                      type="EMAIL"
                      currentContent={formData.content}
                      currentSubject={formData.subject}
                      onGenerate={(generatedSubject, generatedContent) => {
                        setFormData({
                          ...formData,
                          subject: generatedSubject,
                          content: generatedContent,
                        });
                      }}
                    />
                  </div>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Email subject line"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="content">Message Content *</Label>
                  {formData.type === "SMS" && (
                    <AITemplateGenerator
                      type="SMS"
                      currentContent={formData.content}
                      onGenerate={(subject, content) => {
                        setFormData({ ...formData, content });
                      }}
                    />
                  )}
                </div>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={8}
                  placeholder="Use variables: {{amount}}, {{donorName}}, {{transactionId}}, {{date}}, {{category}}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {"{{amount}}"}, {"{{donorName}}"}, {"{{transactionId}}"}, {"{{date}}"}, {"{{category}}"}
                </p>
              </div>

              <div>
                <Label htmlFor="trigger">Trigger (Optional)</Label>
                <Input
                  id="trigger"
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  placeholder="e.g., paypal_payment_received"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isDefault">Set as default template for this category</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: "#1E40AF" }}>
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates by Category */}
      {categories.map((category) => {
        const categoryTemplates = templates.filter((t) => t.category === category);
        if (categoryTemplates.length === 0 && category !== "GENERAL") return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.replace(/_/g, " ")}
                <Badge variant="outline">{categoryTemplates.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryTemplates.length > 0 ? (
                <div className="space-y-3">
                  {categoryTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          <span className="font-medium">{template.name}</span>
                          {template.isDefault && (
                            <Badge variant="default" className="text-xs">Default</Badge>
                          )}
                          {!template.isActive && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {template.content.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No templates in this category</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

