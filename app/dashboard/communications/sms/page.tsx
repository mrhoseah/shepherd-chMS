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
import { MessageCircle, Send, Users, Phone, UserCheck, Shield, UserPlus, UserCircle, Search, Loader2 } from "lucide-react";
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

export default function SMSPage() {
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<string>("individuals");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [manualNumbers, setManualNumbers] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSendSMS = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    const hasRecipients = recipientType === "groups" 
      ? selectedGroups.length > 0 
      : selectedRecipients.length > 0;
    
    if (!hasRecipients && !manualNumbers.trim()) {
      alert("Please select at least one recipient or enter a manual phone number");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/communications/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          recipientIds: recipientType === "groups" ? [] : selectedRecipients,
          groupIds: recipientType === "groups" ? selectedGroups : undefined,
          manualNumbers: manualNumbers.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send SMS");
      }

      alert(`Successfully sent ${data.sent} SMS message(s)!`);
      
      // Reset form
      setMessage("");
      setSelectedRecipients([]);
      setSelectedGroups([]);
      setManualNumbers("");
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      alert(error.message || "Failed to send SMS. Please try again.");
    } finally {
      setSending(false);
    }
  };

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

  const clearSelection = () => {
    setSelectedRecipients([]);
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

  const getRecipientTypeIcon = (type: string) => {
    switch (type) {
      case "leaders":
        return <UserCheck className="w-4 h-4" />;
      case "admins":
        return <Shield className="w-4 h-4" />;
      case "guests":
        return <UserPlus className="w-4 h-4" />;
      case "groups":
        return <Users className="w-4 h-4" />;
      default:
        return <UserCircle className="w-4 h-4" />;
    }
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

  // Paginate filtered results
  const totalPages = Math.ceil(
    (recipientType === "groups" ? filteredGroups.length : filteredRecipients.length) / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecipients = filteredRecipients.slice(startIndex, endIndex);
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

  // Select all filtered results (not just current page)
  const selectAll = () => {
    if (recipientType === "groups") {
      setSelectedRecipients(filteredGroups.map((g) => g.id));
    } else {
      setSelectedRecipients(filteredRecipients.map((r) => r.id));
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SMS</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Send SMS messages to your congregation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send SMS Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Compose SMS
            </CardTitle>
            <CardDescription>
              Send SMS messages using Afrika's Talking API
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
                  Select {getRecipientTypeLabel(recipientType)} (
                  {recipientType === "groups" 
                    ? selectedGroups.length 
                    : selectedRecipients.length} selected)
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
                            {recipient.phone && <span>{recipient.phone}</span>}
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
                    ({recipientType === "groups" ? filteredGroups.length : filteredRecipients.length} total)
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

            {/* Manual Phone Numbers */}
            <div>
              <Label htmlFor="manualNumbers">Or Enter Phone Numbers Manually</Label>
              <Input
                id="manualNumbers"
                placeholder="+254712345678, +254798765432"
                value={manualNumbers}
                onChange={(e) => setManualNumbers(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated phone numbers
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="message">Message</Label>
                <AITemplateGenerator
                  type="SMS"
                  currentContent={message}
                  onGenerate={(subject, content) => {
                    setMessage(content);
                  }}
                />
              </div>
              <Textarea
                id="message"
                className="w-full min-h-[150px]"
                placeholder="Type your message here... Use {{firstName}}, {{givenName}}, {{lastName}}, {{fullName}} for personalization"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={160}
              />
              <div className="flex items-start justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {message.length}/160 characters
                </p>
                <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="font-semibold">Personalization Variables:</span> Use these to personalize each message:
                  <div className="mt-1 flex flex-wrap gap-1">
                    <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{firstName}}"}</code>
                    <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{givenName}}"}</code>
                    <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{lastName}}"}</code>
                    <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{fullName}}"}</code>
                    <code className="bg-white dark:bg-gray-800 px-1 rounded">{"{{middleName}}"}</code>
                  </div>
                  <p className="mt-1 text-xs">Example: "Hello {"{{"}firstName{"}}"}, thank you for being part of our church family!"</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                style={{ backgroundColor: "#1E40AF" }}
                onClick={handleSendSMS}
                disabled={sending || !message.trim() || ((recipientType === "groups" ? selectedGroups.length === 0 : selectedRecipients.length === 0) && !manualNumbers.trim())}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS ({(recipientType === "groups" ? selectedGroups.length : selectedRecipients.length) + (manualNumbers.trim() ? manualNumbers.split(",").filter(n => n.trim()).length : 0)} recipients)
                  </>
                )}
              </Button>
              <Button variant="outline" disabled={sending}>Save Draft</Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Info */}
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
                  setRecipientType("guests");
                  setTimeout(selectAll, 100);
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Send to All Guests
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Afrika's Talking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Integrated with Afrika's Talking SMS API for reliable message delivery across Africa.
              </p>
              <Button variant="link" className="p-0 mt-2">
                Configure API Settings →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SMS Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages sent yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
