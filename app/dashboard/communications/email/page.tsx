"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Send, Users, FileText, BarChart3, UserCheck, Shield, UserPlus, UserCircle, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AITemplateGenerator } from "@/components/ai-template-generator";

interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

export default function EmailPage() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState<string>("individuals");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [manualEmails, setManualEmails] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRecipients();
    setCurrentPage(1); // Reset to first page when recipient type changes
    setSearchQuery(""); // Clear search when recipient type changes
  }, [recipientType]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communications/recipients?type=${recipientType}`);
      const data = await res.json();
      if (recipientType === "groups") {
        setGroups(data.groups || []);
      } else {
        setRecipients(data.recipients || []);
      }
    } catch (error) {
      console.error("Error fetching recipients:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedRecipients([]);
    setSelectedGroups([]);
  };

  const getRecipientTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      leaders: "Leaders",
      groups: "Groups",
      individuals: "All Members",
      guests: "Guests",
      admins: "Admins",
    };
    return labels[type] || type;
  };

  // Filter recipients/groups based on search query
  const filteredRecipients = recipients.filter((recipient) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      recipient.firstName.toLowerCase().includes(query) ||
      recipient.lastName.toLowerCase().includes(query) ||
      recipient.email?.toLowerCase().includes(query) ||
      recipient.phone?.toLowerCase().includes(query) ||
      recipient.role.toLowerCase().includes(query)
    );
  });

  const filteredGroups = groups.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    );
  });

  // Filter recipients with email for email page
  const recipientsWithEmail = filteredRecipients.filter((r) => r.email);
  
  // Paginate filtered results
  const totalPages = Math.ceil(
    (recipientType === "groups" ? filteredGroups.length : recipientsWithEmail.length) / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecipients = recipientsWithEmail.slice(startIndex, endIndex);
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

  // Select all filtered results (not just current page)
  const selectAll = () => {
    if (recipientType === "groups") {
      setSelectedGroups(filteredGroups.map((g) => g.id));
    } else {
      setSelectedRecipients(recipientsWithEmail.map((r) => r.id));
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !content.trim()) {
      alert("Please enter both subject and content");
      return;
    }

    const hasRecipients = recipientType === "groups" 
      ? selectedGroups.length > 0 
      : selectedRecipients.length > 0;
    
    if (!hasRecipients && !manualEmails.trim()) {
      alert("Please select at least one recipient or enter a manual email address");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/communications/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          content,
          recipientIds: recipientType === "groups" ? [] : selectedRecipients,
          groupIds: recipientType === "groups" ? selectedGroups : undefined,
          manualEmails: manualEmails.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      alert(`Successfully sent ${data.sent} email(s)!`);
      
      // Reset form
      setSubject("");
      setContent("");
      setSelectedRecipients([]);
      setSelectedGroups([]);
      setManualEmails("");
    } catch (error: any) {
      console.error("Error sending email:", error);
      alert(error.message || "Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and send email campaigns to your congregation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Email */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Compose Email
            </CardTitle>
            <CardDescription>
              Create engaging email campaigns for your church
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipientType">Recipient Type</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individuals">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      All Members
                    </div>
                  </SelectItem>
                  <SelectItem value="leaders">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Leaders
                    </div>
                  </SelectItem>
                  <SelectItem value="groups">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Groups
                    </div>
                  </SelectItem>
                  <SelectItem value="guests">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Guests
                    </div>
                  </SelectItem>
                  <SelectItem value="admins">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admins
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>
                  Select {getRecipientTypeLabel(recipientType)} ({selectedRecipients.length} selected)
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Search Input */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={`Search ${getRecipientTypeLabel(recipientType).toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : recipientType === "groups" ? (
                  paginatedGroups.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      {searchQuery ? "No groups found matching your search" : "No groups available"}
                    </div>
                  ) : (
                    paginatedGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <Checkbox
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => toggleGroup(group.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-gray-500">
                            {group._count.members} members
                          </p>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  paginatedRecipients.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      {searchQuery ? "No recipients found matching your search" : "No recipients available"}
                    </div>
                  ) : (
                    paginatedRecipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => toggleRecipient(recipient.id)}
                          >
                            <Checkbox
                              checked={selectedRecipients.includes(recipient.id)}
                              onCheckedChange={() => toggleRecipient(recipient.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">
                                {recipient.firstName} {recipient.lastName}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                {recipient.email && <span>{recipient.email}</span>}
                                <Badge variant="outline" className="text-xs">
                                  {recipient.role}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))
                    )
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages} 
                    ({recipientType === "groups" ? filteredGroups.length : recipientsWithEmail.length} total)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Manual Email Addresses */}
            <div>
              <Label htmlFor="manualEmails">Or Enter Email Addresses Manually</Label>
              <Input
                id="manualEmails"
                type="email"
                placeholder="email1@example.com, email2@example.com"
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated email addresses
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="subject">Subject</Label>
                <AITemplateGenerator
                  type="EMAIL"
                  currentContent={content}
                  currentSubject={subject}
                  onGenerate={(generatedSubject, generatedContent) => {
                    setSubject(generatedSubject);
                    setContent(generatedContent);
                  }}
                />
              </div>
              <Input
                id="subject"
                placeholder="Email subject line"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="content">Email Content</Label>
              <Textarea
                id="content"
                className="w-full min-h-[300px]"
                placeholder="Write your email content here... Use {{firstName}}, {{givenName}}, {{lastName}}, {{fullName}} for personalization"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="font-semibold">Personalization Variables:</span> Use these to personalize each email:
                <div className="mt-1 flex flex-wrap gap-1">
                  <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{firstName}}"}</code>
                  <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{givenName}}"}</code>
                  <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{lastName}}"}</code>
                  <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{fullName}}"}</code>
                  <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{middleName}}"}</code>
                </div>
                <p className="mt-1 text-xs">These will be replaced with each recipient's information. Example: "Dear {"{{"}firstName{"}}"}, we're excited to share..."</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                style={{ backgroundColor: "#1E40AF" }}
                onClick={handleSendEmail}
                disabled={sending || !subject.trim() || !content.trim() || ((recipientType === "groups" ? selectedGroups.length === 0 : selectedRecipients.length === 0) && !manualEmails.trim())}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email ({(recipientType === "groups" ? selectedGroups.length : selectedRecipients.length) + (manualEmails.trim() ? manualEmails.split(",").filter(e => e.trim() && e.includes("@")).length : 0)} recipients)
                  </>
                )}
              </Button>
              <Button variant="outline" disabled={sending}>Save Draft</Button>
              <Button variant="outline" disabled={sending}>Preview</Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setRecipientType("individuals");
                  setTimeout(selectAll, 100);
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Send to All Members
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setRecipientType("leaders");
                  setTimeout(selectAll, 100);
                }}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Send to All Leaders
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setRecipientType("groups");
                  setTimeout(selectAll, 100);
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Send to All Groups
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Use Template
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Configure your email provider settings
              </p>
              <Button variant="link" className="p-0">
                Configure Settings →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Campaign History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No campaigns sent yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
