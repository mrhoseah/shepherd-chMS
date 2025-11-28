"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Save,
  UserPlus,
  MessageSquare,
  Heart,
  Frown,
  Meh,
  Smile,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  allergies?: string[];
  medications?: string[];
  parentDailyNotes?: string;
}

interface ChildLog {
  childId: string;
  isPresent: boolean;
  behaviorTags: string[];
  engagementLevel: number;
  notes: string;
  checkedInAt?: Date;
}

const behaviorTags = [
  "Shared well",
  "Helpful",
  "Attentive",
  "Participative",
  "Distracted",
  "Disruptive",
  "Quiet",
  "Energetic",
  "Creative",
  "Needs attention",
];

const engagementEmojis = [
  { level: 1, icon: Frown, label: "Disengaged", color: "text-red-500" },
  { level: 2, icon: Meh, label: "Low", color: "text-orange-500" },
  { level: 3, icon: Smile, label: "Average", color: "text-yellow-500" },
  { level: 4, icon: Smile, label: "Good", color: "text-green-500" },
  { level: 5, icon: Sparkles, label: "Excellent", color: "text-blue-500" },
];

export default function TeacherAttendancePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [childLogs, setChildLogs] = useState<Map<string, ChildLog>>(new Map());
  const [loading, setLoading] = useState(false);
  const [newVisitor, setNewVisitor] = useState({ firstName: "", lastName: "", phone: "" });
  const [showVisitorForm, setShowVisitorForm] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/children/teacher-attendance");
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    }
  };

  const startAttendance = async (classId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/children/teacher-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      });

      const data = await response.json();
      setAttendance(data.attendance);
      setSelectedClass(data.attendance.class);

      // Initialize logs for all members
      const logs = new Map<string, ChildLog>();
      data.attendance.class.members.forEach((member: any) => {
        logs.set(member.user.id, {
          childId: member.user.id,
          isPresent: false,
          behaviorTags: [],
          engagementLevel: 3,
          notes: "",
        });
      });
      setChildLogs(logs);

      toast({
        title: "Success",
        description: "Attendance started. Mark children as present.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePresence = (childId: string) => {
    setChildLogs((prev) => {
      const newLogs = new Map(prev);
      const log = newLogs.get(childId);
      if (log) {
        log.isPresent = !log.isPresent;
        if (log.isPresent && !log.checkedInAt) {
          log.checkedInAt = new Date();
        }
        newLogs.set(childId, log);
      }
      return newLogs;
    });
  };

  const toggleBehaviorTag = (childId: string, tag: string) => {
    setChildLogs((prev) => {
      const newLogs = new Map(prev);
      const log = newLogs.get(childId);
      if (log) {
        const tags = log.behaviorTags;
        const index = tags.indexOf(tag);
        if (index > -1) {
          tags.splice(index, 1);
        } else {
          tags.push(tag);
        }
        newLogs.set(childId, log);
      }
      return newLogs;
    });
  };

  const updateEngagement = (childId: string, level: number) => {
    setChildLogs((prev) => {
      const newLogs = new Map(prev);
      const log = newLogs.get(childId);
      if (log) {
        log.engagementLevel = level;
        newLogs.set(childId, log);
      }
      return newLogs;
    });
  };

  const updateNotes = (childId: string, notes: string) => {
    setChildLogs((prev) => {
      const newLogs = new Map(prev);
      const log = newLogs.get(childId);
      if (log) {
        log.notes = notes;
        newLogs.set(childId, log);
      }
      return newLogs;
    });
  };

  const saveAttendance = async () => {
    setLoading(true);
    try {
      const logsArray = Array.from(childLogs.values());

      // Save each log
      await Promise.all(
        logsArray.map((log) =>
          fetch("/api/children/classroom-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...log,
              classId: selectedClass.id,
              sessionDate: new Date(),
            }),
          })
        )
      );

      // Finalize teacher attendance
      const presentCount = logsArray.filter((l) => l.isPresent).length;
      await fetch("/api/children/teacher-attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: attendance.id,
          totalChildren: logsArray.length,
          presentChildren: presentCount,
        }),
      });

      toast({
        title: "Success",
        description: `Attendance saved! ${presentCount} children present.`,
      });

      // Reset
      setSelectedClass(null);
      setAttendance(null);
      setChildLogs(new Map());
      fetchClasses();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedClass) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Classes</h1>
          <p className="text-muted-foreground">Select a class to take attendance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => startAttendance(cls.id)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {cls.name}
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {cls._count.members}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Ages {cls.ageMin}-{cls.ageMax} • {cls.capacity ? `Max ${cls.capacity}` : "No limit"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  Start Attendance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const presentCount = Array.from(childLogs.values()).filter((l) => l.isPresent).length;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6 sticky top-0 bg-background z-10 pb-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">{selectedClass.name}</h1>
            <p className="text-sm text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button onClick={() => setSelectedClass(null)} variant="outline">
            Cancel
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {presentCount} / {selectedClass.members.length} Present
          </Badge>
          <Button onClick={saveAttendance} disabled={loading} className="ml-auto">
            <Save className="w-4 h-4 mr-2" />
            Finalize Attendance
          </Button>
        </div>
      </div>

      {/* Children List */}
      <div className="space-y-4">
        {selectedClass.members.map((member: any) => {
          const child = member.user;
          const log = childLogs.get(child.id);
          const childProfile = child.childProfiles?.[0];

          return (
            <Card
              key={child.id}
              className={`${log?.isPresent ? "border-green-500 border-2" : ""} transition-all`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {child.firstName[0]}{child.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{child.firstName} {child.lastName}</h3>
                      {childProfile?.allergies && childProfile.allergies.length > 0 && (
                        <Badge variant="destructive" className="mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Allergies: {childProfile.allergies.join(", ")}
                        </Badge>
                      )}
                      {childProfile?.parentDailyNotes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📝 {childProfile.parentDailyNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="lg"
                    variant={log?.isPresent ? "default" : "outline"}
                    onClick={() => togglePresence(child.id)}
                  >
                    {log?.isPresent ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Present
                      </>
                    ) : (
                      <>Mark Present</>
                    )}
                  </Button>
                </div>
              </CardHeader>

              {log?.isPresent && (
                <CardContent className="space-y-4">
                  {/* Engagement Level */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Engagement</label>
                    <div className="flex gap-2">
                      {engagementEmojis.map((emoji) => {
                        const Icon = emoji.icon;
                        return (
                          <Button
                            key={emoji.level}
                            variant={log.engagementLevel === emoji.level ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateEngagement(child.id, emoji.level)}
                            className="flex-1"
                          >
                            <Icon className={`w-4 h-4 ${emoji.color}`} />
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Behavior Tags */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quick Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {behaviorTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={log.behaviorTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleBehaviorTag(child.id, tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes</label>
                    <Textarea
                      placeholder="Add notes about today's class..."
                      value={log.notes}
                      onChange={(e) => updateNotes(child.id, e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Visitor Button */}
      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={() => setShowVisitorForm(!showVisitorForm)}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Add New Visitor
      </Button>
    </div>
  );
}
