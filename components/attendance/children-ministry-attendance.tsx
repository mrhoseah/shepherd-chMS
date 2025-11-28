"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Baby,
  GraduationCap,
  Crown,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Heart,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChildrenClass {
  id: string;
  name: string;
  ageMin: number;
  ageMax: number;
  capacity: number | null;
  leaderId: string | null;
  leader: {
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    members: number;
  };
}

interface ChildAttendance {
  id: string;
  firstName: string;
  lastName: string;
  isPresent: boolean;
  checkedInAt?: string;
  checkedOutAt?: string;
  engagementLevel: number;
  behaviorTags: string[];
  notes: string;
  allergies?: string[];
  medications?: string[];
  parentDailyNotes?: string;
}

interface TeacherAttendance {
  teacherId: string;
  teacherName: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: string;
  notes: string;
}

const behaviorTags = [
  "Shared well", "Helpful", "Attentive", "Participative",
  "Distracted", "Disruptive", "Quiet", "Energetic",
  "Creative", "Needs attention"
];

const engagementEmojis = [
  { level: 1, icon: "😞", label: "Disengaged", color: "text-red-500" },
  { level: 2, icon: "😐", label: "Low", color: "text-orange-500" },
  { level: 3, icon: "🙂", label: "Average", color: "text-yellow-500" },
  { level: 4, icon: "😊", label: "Good", color: "text-green-500" },
  { level: 5, icon: "✨", label: "Excellent", color: "text-blue-500" },
];

export function ChildrenMinistryAttendance() {
  const [classes, setClasses] = useState<ChildrenClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<ChildrenClass | null>(null);
  const [attendance, setAttendance] = useState<ChildAttendance[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    firstName: "", lastName: "", parentName: "", parentPhone: ""
  });
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [classSummary, setClassSummary] = useState({
    totalChildren: 0,
    presentChildren: 0,
    newVisitors: 0,
    teacherNotes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassAttendance();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/children/classes");
      const data = await response.json();
      setClasses(data.classes || []);
      if (data.classes && data.classes.length > 0) {
        setSelectedClass(data.classes[0]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    }
  };

  const fetchClassAttendance = async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(
        `/api/children/attendance?classId=${selectedClass.id}&date=${today}`
      );
      const data = await response.json();

      setAttendance(data.children || []);
      setTeacherAttendance(data.teachers || []);
      setClassSummary(data.summary || {
        totalChildren: 0,
        presentChildren: 0,
        newVisitors: 0,
        teacherNotes: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChildAttendance = (childId: string, updates: Partial<ChildAttendance>) => {
    setAttendance(prev =>
      prev.map(child =>
        child.id === childId ? { ...child, ...updates } : child
      )
    );
  };

  const toggleChildPresent = (childId: string) => {
    setAttendance(prev =>
      prev.map(child => {
        if (child.id === childId) {
          const isPresent = !child.isPresent;
          return {
            ...child,
            isPresent,
            checkedInAt: isPresent && !child.checkedInAt
              ? new Date().toISOString()
              : child.checkedInAt,
            checkedOutAt: !isPresent ? new Date().toISOString() : child.checkedOutAt
          };
        }
        return child;
      })
    );
  };

  const addBehaviorTag = (childId: string, tag: string) => {
    setAttendance(prev =>
      prev.map(child => {
        if (child.id === childId) {
          const behaviorTags = child.behaviorTags.includes(tag)
            ? child.behaviorTags.filter(t => t !== tag)
            : [...child.behaviorTags, tag];
          return { ...child, behaviorTags };
        }
        return child;
      })
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;

    setSaving(true);
    try {
      const response = await fetch("/api/children/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass.id,
          date: format(new Date(), "yyyy-MM-dd"),
          children: attendance,
          teachers: teacherAttendance,
          summary: classSummary,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save attendance");
      }

      toast({
        title: "Attendance Saved",
        description: "Children's attendance has been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddVisitor = async () => {
    if (!newVisitor.firstName || !newVisitor.lastName) {
      toast({
        title: "Error",
        description: "Please enter visitor name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/children/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newVisitor,
          classId: selectedClass?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add visitor");
      }

      const data = await response.json();

      // Add to attendance list
      const newChild: ChildAttendance = {
        id: data.child.id,
        firstName: data.child.firstName,
        lastName: data.child.lastName,
        isPresent: true,
        checkedInAt: new Date().toISOString(),
        engagementLevel: 3,
        behaviorTags: [],
        notes: "First time visitor",
      };

      setAttendance(prev => [...prev, newChild]);
      setNewVisitor({ firstName: "", lastName: "", parentName: "", parentPhone: "" });
      setShowVisitorForm(false);
      setClassSummary(prev => ({ ...prev, newVisitors: prev.newVisitors + 1 }));

      toast({
        title: "Visitor Added",
        description: "New visitor has been checked in",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getClassIcon = (className: string) => {
    if (className.toLowerCase().includes("nursery") || className.toLowerCase().includes("baby")) {
      return <Baby className="w-5 h-5" />;
    } else if (className.toLowerCase().includes("preschool") || className.toLowerCase().includes("toddler")) {
      return <Users className="w-5 h-5" />;
    } else if (className.toLowerCase().includes("elementary") || className.toLowerCase().includes("primary")) {
      return <GraduationCap className="w-5 h-5" />;
    }
    return <Crown className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Baby className="w-6 h-6 text-pink-600" />
            Children's Ministry Attendance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track attendance, engagement, and teacher check-ins for children's classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowVisitorForm(true)}
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Visitor
          </Button>
          <Button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Attendance
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Class Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2 border-pink-100 dark:border-pink-900/50">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {classes.length === 0 ? (
                <div className="text-center py-4">
                  <Baby className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No classes found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                        selectedClass?.id === cls.id
                          ? "border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30"
                          : "border-gray-200 hover:border-pink-300 dark:border-gray-800 dark:hover:border-pink-700"
                      }`}
                      onClick={() => setSelectedClass(cls)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getClassIcon(cls.name)}
                        <span className="font-medium text-sm">{cls.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Ages {cls.ageMin}-{cls.ageMax} • {cls._count.members} enrolled
                      </div>
                      {cls.leader && (
                        <div className="text-xs text-gray-500 mt-1">
                          Teacher: {cls.leader.firstName} {cls.leader.lastName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Class Summary */}
          {selectedClass && (
            <Card className="border-2 border-purple-100 dark:border-purple-900/50">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardTitle className="text-lg">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Enrolled</span>
                  <Badge variant="outline">{classSummary.totalChildren}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Present Today</span>
                  <Badge className="bg-green-100 text-green-800">{classSummary.presentChildren}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Visitors</span>
                  <Badge className="bg-blue-100 text-blue-800">{classSummary.newVisitors}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <Label className="text-sm font-medium">Teacher Notes</Label>
                  <Textarea
                    value={classSummary.teacherNotes}
                    onChange={(e) => setClassSummary(prev => ({ ...prev, teacherNotes: e.target.value }))}
                    placeholder="Any notes about today's class..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Attendance Grid */}
        <div className="lg:col-span-3">
          {selectedClass ? (
            <Card className="border-2 border-pink-100 dark:border-pink-900/50">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getClassIcon(selectedClass.name)}
                    {selectedClass.name} - {format(new Date(), "MMMM d, yyyy")}
                  </span>
                  <Badge variant="outline" className="bg-white/80">
                    {attendance.filter(c => c.isPresent).length} / {attendance.length} present
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                  </div>
                ) : attendance.length === 0 ? (
                  <div className="text-center py-8">
                    <Baby className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-600 dark:text-gray-400">No children enrolled in this class</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attendance.map((child) => (
                      <div
                        key={child.id}
                        className={`p-4 border-2 rounded-lg transition-all duration-300 ${
                          child.isPresent
                            ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                            : "border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={child.isPresent}
                              onCheckedChange={() => toggleChildPresent(child.id)}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {child.firstName} {child.lastName}
                              </h4>
                              {child.allergies && child.allergies.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                                  <span className="text-xs text-orange-600">
                                    Allergies: {child.allergies.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {child.isPresent && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Present
                              </Badge>
                            )}
                            {child.checkedInAt && (
                              <span className="text-xs text-gray-500">
                                In: {format(new Date(child.checkedInAt), "h:mm a")}
                              </span>
                            )}
                          </div>
                        </div>

                        {child.isPresent && (
                          <div className="space-y-3">
                            {/* Engagement Level */}
                            <div>
                              <Label className="text-sm font-medium">Engagement Level</Label>
                              <div className="flex items-center gap-2 mt-1">
                                {engagementEmojis.map((emoji) => (
                                  <button
                                    key={emoji.level}
                                    onClick={() => updateChildAttendance(child.id, { engagementLevel: emoji.level })}
                                    className={`p-2 rounded-lg border-2 transition-all ${
                                      child.engagementLevel === emoji.level
                                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                                        : "border-gray-200 hover:border-purple-300"
                                    }`}
                                    title={emoji.label}
                                  >
                                    <span className="text-lg">{emoji.icon}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Behavior Tags */}
                            <div>
                              <Label className="text-sm font-medium">Behavior Tags</Label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {behaviorTags.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => addBehaviorTag(child.id, tag)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                      child.behaviorTags.includes(tag)
                                        ? "border-pink-500 bg-pink-100 text-pink-800 dark:bg-pink-950/30 dark:text-pink-400"
                                        : "border-gray-200 hover:border-pink-300 text-gray-600"
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Notes */}
                            <div>
                              <Label className="text-sm font-medium">Notes</Label>
                              <Textarea
                                value={child.notes}
                                onChange={(e) => updateChildAttendance(child.id, { notes: e.target.value })}
                                placeholder="Any observations or notes..."
                                rows={2}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-pink-100 dark:border-pink-900/50">
              <CardContent className="py-12 text-center">
                <Baby className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Class
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a children's class from the list to start taking attendance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Visitor Form Dialog */}
      {showVisitorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New Visitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Child's First Name *</Label>
                  <Input
                    value={newVisitor.firstName}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Child's Last Name *</Label>
                  <Input
                    value={newVisitor.lastName}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Parent/Guardian Name</Label>
                <Input
                  value={newVisitor.parentName}
                  onChange={(e) => setNewVisitor(prev => ({ ...prev, parentName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Parent Phone</Label>
                <Input
                  value={newVisitor.parentPhone}
                  onChange={(e) => setNewVisitor(prev => ({ ...prev, parentPhone: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowVisitorForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVisitor} className="bg-pink-600 hover:bg-pink-700">
                  Add Visitor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}