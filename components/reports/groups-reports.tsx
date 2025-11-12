"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "./data-table";
import { MetricCard } from "./metric-card";
import { ReportSection } from "./report-section";
import { Download, Users, UsersRound, Crown, Building2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { exportToPDF, exportToExcel } from "@/lib/reports/export";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
    type?: string | null;
  } | null;
  subgroups?: Group[];
  leader?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  leadershipAssignments?: Array<{
    id: string;
    title: string;
    isPrimary: boolean;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
    };
  }>;
  _count: {
    members: number;
    subgroups: number;
  };
}

interface GroupMember {
  name: string;
  groupName: string;
  phone: string;
  email?: string;
  role?: string;
}

export function GroupsReports() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups?includeSubgroups=true");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten groups for selection and display
  const flattenGroups = (groups: Group[]): Group[] => {
    const result: Group[] = [];
    groups.forEach((group) => {
      result.push(group);
      if (group.subgroups) {
        result.push(...flattenGroups(group.subgroups));
      }
    });
    return result;
  };

  const allGroups = flattenGroups(groups);

  // Filter groups by search query
  const filteredGroups = allGroups.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.type?.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query) ||
      group.leader?.firstName.toLowerCase().includes(query) ||
      group.leader?.lastName.toLowerCase().includes(query)
    );
  });

  const getAllSubgroupIds = (group: Group): string[] => {
    const ids = [group.id];
    if (group.subgroups) {
      group.subgroups.forEach((subgroup) => {
        ids.push(...getAllSubgroupIds(subgroup));
      });
    }
    return ids;
  };

  const handleExportGroupMembers = async () => {
    if (!selectedGroupId) {
      alert("Please select a group");
      return;
    }

    setExporting(true);
    try {
      // Find the selected group
      const findGroup = (groups: Group[], id: string): Group | null => {
        for (const group of groups) {
          if (group.id === id) return group;
          if (group.subgroups) {
            const found = findGroup(group.subgroups, id);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedGroup = findGroup(groups, selectedGroupId);
      if (!selectedGroup) {
        alert("Group not found");
        return;
      }

      // Get all group IDs (parent + all subgroups)
      const allGroupIds = getAllSubgroupIds(selectedGroup);

      // Fetch members from all groups
      const allMembers: GroupMember[] = [];

      for (const groupId of allGroupIds) {
        try {
          const res = await fetch(`/api/groups/${groupId}/members`);
          if (res.ok) {
            const data = await res.json();
            const group = findGroup(groups, groupId);
            const groupName = group?.name || "Unknown Group";

            (data.members || []).forEach((member: any) => {
              if (member.user && member.leftAt === null) {
                const fullName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim();
                allMembers.push({
                  name: fullName,
                  groupName: groupName,
                  phone: member.user.phone || "",
                  email: member.user.email || "",
                  role: member.role || "",
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching members for group ${groupId}:`, error);
        }
      }

      if (allMembers.length === 0) {
        alert("No members found in this group");
        return;
      }

      // Create CSV
      const headers = ["Name", "Group Name", "Phone Number", "Email", "Role"];
      const csvContent = [
        headers.join(","),
        ...allMembers.map((member) =>
          [
            `"${member.name.replace(/"/g, '""')}"`,
            `"${member.groupName.replace(/"/g, '""')}"`,
            `"${member.phone.replace(/"/g, '""')}"`,
            `"${(member.email || "").replace(/"/g, '""')}"`,
            `"${(member.role || "").replace(/"/g, '""')}"`,
          ].join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const groupName = selectedGroup.name.replace(/[^a-z0-9]/gi, "_");
      a.download = `${groupName}_all_members_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting group members:", error);
      alert("Failed to export group members");
    } finally {
      setExporting(false);
    }
  };

  const handleExportAllGroups = () => {
    const groupsData = filteredGroups.map((group) => ({
      name: group.name,
      type: group.type || "",
      parent: group.parent?.name || "",
      leaders: group.leadershipAssignments && group.leadershipAssignments.length > 0
        ? group.leadershipAssignments.map((a) => `${a.user.firstName} ${a.user.lastName} (${a.title})`).join("; ")
        : group.leader
        ? `${group.leader.firstName} ${group.leader.lastName}`
        : "",
      members: group._count.members,
      subgroups: group._count.subgroups,
    }));

    const headers = ["Group Name", "Type", "Parent Group", "Leaders", "Members", "Subgroups"];
    const csvContent = [
      headers.join(","),
      ...groupsData.map((group) =>
        [
          `"${group.name.replace(/"/g, '""')}"`,
          `"${group.type.replace(/"/g, '""')}"`,
          `"${group.parent.replace(/"/g, '""')}"`,
          `"${group.leaders.replace(/"/g, '""')}"`,
          group.members,
          group.subgroups,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_groups_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const totalGroups = allGroups.length;
  const totalMembers = allGroups.reduce((sum, group) => sum + group._count.members, 0);
  const groupsWithLeaders = allGroups.filter(
    (group) => (group.leadershipAssignments && group.leadershipAssignments.length > 0) || group.leader
  ).length;
  const parentGroups = allGroups.filter((group) => !group.parentId).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Loading groups...
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="groups-report-content" className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Groups"
          value={totalGroups}
          icon={Building2}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Total Members"
          value={totalMembers}
          icon={Users}
          iconColor="text-green-500"
        />
        <MetricCard
          title="Groups with Leaders"
          value={groupsWithLeaders}
          icon={Crown}
          iconColor="text-yellow-500"
        />
        <MetricCard
          title="Parent Groups"
          value={parentGroups}
          icon={TrendingUp}
          iconColor="text-purple-500"
        />
      </div>

      {/* Export Group Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="w-5 h-5" />
            Export Group Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="groupSelect">Select Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger id="groupSelect">
                  <SelectValue placeholder="Choose a group to export members..." />
                </SelectTrigger>
                <SelectContent>
                  {allGroups.map((group) => {
                    const indent = group.parentId ? "  " : "";
                    return (
                      <SelectItem key={group.id} value={group.id}>
                        {indent}{group.name} {group.type && `(${group.type})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                Export all members from the selected group and its subgroups (if any)
              </p>
            </div>
            <Button
              onClick={handleExportGroupMembers}
              disabled={!selectedGroupId || exporting}
              style={{ backgroundColor: "#1E40AF" }}
            >
              {exporting ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Members
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Groups Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Groups</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <Button variant="outline" onClick={handleExportAllGroups}>
                <Download className="w-4 h-4 mr-2" />
                Export All Groups
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredGroups.map((group) => ({
              name: group.name,
              type: group.type || "—",
              parent: group.parent?.name || "—",
              leaders:
                group.leadershipAssignments && group.leadershipAssignments.length > 0
                  ? group.leadershipAssignments
                      .map((a) => `${a.user.firstName} ${a.user.lastName} (${a.title})`)
                      .join(", ")
                  : group.leader
                  ? `${group.leader.firstName} ${group.leader.lastName}`
                  : "—",
              members: group._count.members,
              subgroups: group._count.subgroups,
            }))}
            columns={[
              { key: "name", label: "Group Name", sortable: true },
              { key: "type", label: "Type", sortable: true },
              { key: "parent", label: "Parent Group", sortable: true },
              { key: "leaders", label: "Leaders", sortable: false },
              { key: "members", label: "Members", sortable: true, align: "right" },
              { key: "subgroups", label: "Subgroups", sortable: true, align: "right" },
            ]}
            title="Groups List"
          />
        </CardContent>
      </Card>

      {/* Groups by Type */}
      <ReportSection title="Groups by Type">
        <DataTable
          data={Object.entries(
            allGroups.reduce((acc, group) => {
              const type = group.type || "Unspecified";
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          )
            .map(([type, count]) => ({
              type,
              count,
              percentage: ((count / totalGroups) * 100).toFixed(1),
            }))
            .sort((a, b) => b.count - a.count)}
          columns={[
            { key: "type", label: "Type", sortable: true },
            { key: "count", label: "Count", sortable: true, align: "right" },
            {
              key: "percentage",
              label: "Percentage",
              sortable: true,
              format: (val) => `${val}%`,
              align: "right",
            },
          ]}
        />
      </ReportSection>
    </div>
  );
}

