"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2, Plus, LayoutTemplate, Users, Download, Upload, Wand2, Ruler } from "lucide-react";
import { DraggableFurniture, LayoutItem } from "@/components/seating/draggable-furniture";
import { furnitureConfigs, presetTemplates } from "@/lib/seating-config";
import type { FurnitureType } from "@/lib/generated/prisma/enums";
import {
  generateSeatingLayout,
  RoomMeasurements,
  SeatingRequirements,
} from "@/lib/ai-seating-generator";
import { getChurchFeatures } from "@/lib/subscription-utils";
import { AlertCircle, Crown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Extend the session type to include churchId
interface ExtendedSession extends Session {
  user: Session["user"] & {
    churchId?: string;
  };
}

export default function SeatingPlannerPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  // State
  const [layouts, setLayouts] = useState<any[]>([]);
  const [currentLayout, setCurrentLayout] = useState<any>(null);
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>([]);
  const [canvasWidth] = useState(1200);
  const [canvasHeight] = useState(900);
  const [loading, setLoading] = useState(false);
  const [showNewLayoutDialog, setShowNewLayoutDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAIGeneratorDialog, setShowAIGeneratorDialog] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutDescription, setNewLayoutDescription] = useState("");
  const [hasAIAccess, setHasAIAccess] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("FREE");

  // AI Generator state
  const [roomLength, setRoomLength] = useState(60);
  const [roomWidth, setRoomWidth] = useState(40);
  const [targetCapacity, setTargetCapacity] = useState(200);
  const [layoutStyle, setLayoutStyle] = useState<"THEATER" | "CIRCULAR" | "U_SHAPE" | "BANQUET" | "CLASSROOM" | "MIXED">("THEATER");
  const [furniturePreference, setFurniturePreference] = useState<"PEWS" | "CHAIRS" | "TABLES" | "MIXED">("PEWS");
  const [includeAltar, setIncludeAltar] = useState(true);
  const [includePulpit, setIncludePulpit] = useState(true);
  const [includeSoundDesk, setIncludeSoundDesk] = useState(true);
  const [includeCamera, setIncludeCamera] = useState(false);

  // Hardcoded churchId for now - in real app, get from session/context
  const churchId = (session as ExtendedSession | null)?.user?.churchId || "default-church-id";

  useEffect(() => {
    fetchLayouts();
    checkAIAccess();
  }, [churchId]);

  const checkAIAccess = async () => {
    try {
      const features = await getChurchFeatures(churchId);
      setHasAIAccess(features.hasAISeatingGenerator);
      setSubscriptionPlan(features.plan);
    } catch (error) {
      console.error("Error checking AI access:", error);
    }
  };

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seating/layouts?churchId=${churchId}`);
      const data = await response.json();
      setLayouts(data.layouts || []);

      // Load default layout if exists
      const defaultLayout = data.layouts?.find((l: any) => l.isDefault);
      if (defaultLayout) {
        loadLayout(defaultLayout.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load layouts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLayout = async (layoutId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/seating/layouts?churchId=${churchId}&layoutId=${layoutId}&includeItems=true`
      );
      const data = await response.json();
      
      if (data.layout) {
        setCurrentLayout(data.layout);
        setLayoutItems(data.layout.items || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load layout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewLayout = async () => {
    if (!newLayoutName.trim()) {
      toast({
        title: "Error",
        description: "Layout name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/seating/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchId,
          name: newLayoutName,
          description: newLayoutDescription,
          canvasWidth,
          canvasHeight,
          items: [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Layout created successfully",
        });
        setCurrentLayout(data.layout);
        setLayoutItems([]);
        fetchLayouts();
        setShowNewLayoutDialog(false);
        setNewLayoutName("");
        setNewLayoutDescription("");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create layout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async () => {
    if (!currentLayout) return;

    try {
      setLoading(true);
      const response = await fetch("/api/seating/layouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutId: currentLayout.id,
          churchId,
          items: layoutItems,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Layout saved successfully",
        });
        setCurrentLayout(data.layout);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save layout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearLayout = () => {
    if (confirm("Are you sure you want to clear all items?")) {
      setLayoutItems([]);
      toast({
        title: "Success",
        description: "Layout cleared",
      });
    }
  };

  const addFurniture = (type: FurnitureType) => {
    const config = furnitureConfigs[type];
    const newItem: LayoutItem = {
      id: crypto.randomUUID(),
      type,
      x: 20,
      y: 20,
      rotation: 0,
      capacity: config.defaultCapacity,
      width: config.width,
      height: config.height,
    };
    setLayoutItems((prev) => [...prev, newItem]);
  };

  const updateItemPosition = useCallback((id: string, x: number, y: number) => {
    setLayoutItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item))
    );
  }, []);

  const rotateItem = useCallback((id: string) => {
    setLayoutItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setLayoutItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItemCapacity = useCallback((id: string, capacity: number) => {
    setLayoutItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, capacity } : item))
    );
  }, []);

  const applyTemplate = (template: typeof presetTemplates[0]) => {
    const templateItems: LayoutItem[] = template.items.map((item) => {
      const config = furnitureConfigs[item.type];
      return {
        id: crypto.randomUUID(),
        type: item.type,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        capacity: config.defaultCapacity,
        width: config.width,
        height: config.height,
      };
    });

    setLayoutItems(templateItems);
    setShowTemplateDialog(false);
    toast({
      title: "Template Applied",
      description: `${template.name} layout loaded`,
    });
  };

  const generateAILayout = async () => {
    try {
      setLoading(true);

      const measurements: RoomMeasurements = {
        length: roomLength,
        width: roomWidth,
        shape: "RECTANGLE",
      };

      const requirements: SeatingRequirements = {
        targetCapacity,
        style: layoutStyle,
        furniturePreference,
        includeAltar,
        includePulpit,
        includeSoundDesk,
        includeCamera,
      };

      const generatedLayout = await generateSeatingLayout(measurements, requirements);

      const layoutItems: LayoutItem[] = generatedLayout.items.map((item) => ({
        id: crypto.randomUUID(),
        type: item.type,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        capacity: item.capacity,
        width: item.width,
        height: item.height,
        label: item.label,
      }));

      setLayoutItems(layoutItems);
      setShowAIGeneratorDialog(false);

      toast({
        title: "AI Layout Generated",
        description: `Generated layout with ${generatedLayout.totalCapacity} seats (${generatedLayout.efficiency}% efficiency)`,
      });

      if (generatedLayout.warnings.length > 0) {
        setTimeout(() => {
          toast({
            title: "Layout Warnings",
            description: generatedLayout.warnings.join(" "),
            variant: "default",
          });
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate layout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCapacity = useMemo(() => {
    return layoutItems.reduce((sum, item) => sum + item.capacity, 0);
  }, [layoutItems]);

  const furnitureButtons = useMemo(
    () =>
      Object.entries(furnitureConfigs).map(([key, config]) => {
        const type = key as FurnitureType;
        const Icon = config.icon;

        return (
          <button
            key={key}
            onClick={() => addFurniture(type)}
            className="flex flex-col items-center p-2 m-1 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition duration-150 w-full"
            title={config.description}
          >
            <Icon className="w-8 h-8" style={{ color: config.color }} />
            <span className="text-[10px] mt-1 font-medium text-gray-700 text-center">
              {config.label}
            </span>
          </button>
        );
      }),
    []
  );

  if (loading && !currentLayout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seating planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-[1600px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Church Seating Planner</h1>
        <p className="text-muted-foreground">
          Drag and drop furniture to design your church seating arrangement
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-2">
          {/* Layout Selector */}
          <Select
            value={currentLayout?.id || ""}
            onValueChange={(value) => loadLayout(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              {layouts.map((layout) => (
                <SelectItem key={layout.id} value={layout.id}>
                  {layout.name} {layout.isDefault && "(Default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showNewLayoutDialog} onOpenChange={setShowNewLayoutDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Layout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Layout</DialogTitle>
                <DialogDescription>
                  Create a new seating arrangement layout
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Layout Name</Label>
                  <Input
                    id="name"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    placeholder="Main Sanctuary"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newLayoutDescription}
                    onChange={(e) => setNewLayoutDescription(e.target.value)}
                    placeholder="Sunday morning worship layout"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createNewLayout} disabled={loading}>
                  Create Layout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={saveLayout} disabled={!currentLayout || loading}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <Button onClick={clearLayout} variant="outline" disabled={!currentLayout}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>

          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Choose a Template</DialogTitle>
                <DialogDescription>
                  Select a preset layout to get started quickly
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {presetTemplates.map((template, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:border-indigo-600 transition"
                    onClick={() => applyTemplate(template)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline">{template.category}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAIGeneratorDialog} onOpenChange={setShowAIGeneratorDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={!hasAIAccess}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Generator
                {!hasAIAccess && <Crown className="w-3 h-3 ml-2" />}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {!hasAIAccess ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      Enterprise Feature
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Premium Feature</AlertTitle>
                      <AlertDescription>
                        The AI Seating Generator is an exclusive feature for Enterprise plan subscribers.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-600" />
                        AI Seating Generator Benefits
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">✓</span>
                          <span>Automatically generate optimized seating layouts based on room dimensions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">✓</span>
                          <span>Choose from 6 intelligent layout styles (Theater, Circular, U-Shape, Banquet, Classroom, Mixed)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">✓</span>
                          <span>AI calculates optimal furniture placement and aisle widths</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">✓</span>
                          <span>Instant capacity optimization with efficiency scoring</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">✓</span>
                          <span>Smart warnings and recommendations for space utilization</span>
                        </li>
                      </ul>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Current Plan: <strong>{subscriptionPlan}</strong>
                      </p>
                      <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Enterprise
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-purple-600" />
                      AI Seating Arrangement Generator
                    </DialogTitle>
                    <DialogDescription>
                      Provide your room measurements and requirements, and AI will automatically
                      generate an optimized seating layout
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                {/* Room Measurements */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Ruler className="w-4 h-4" />
                    Room Measurements
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="roomLength">Length (feet)</Label>
                      <Input
                        id="roomLength"
                        type="number"
                        value={roomLength}
                        onChange={(e) => setRoomLength(parseInt(e.target.value) || 0)}
                        min={20}
                        max={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Front to back dimension
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="roomWidth">Width (feet)</Label>
                      <Input
                        id="roomWidth"
                        type="number"
                        value={roomWidth}
                        onChange={(e) => setRoomWidth(parseInt(e.target.value) || 0)}
                        min={20}
                        max={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Side to side dimension
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seating Requirements */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users className="w-4 h-4" />
                    Seating Requirements
                  </div>
                  
                  <div>
                    <Label htmlFor="targetCapacity">Target Capacity</Label>
                    <Input
                      id="targetCapacity"
                      type="number"
                      value={targetCapacity}
                      onChange={(e) => setTargetCapacity(parseInt(e.target.value) || 0)}
                      min={10}
                      max={2000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Desired number of seats
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="layoutStyle">Layout Style</Label>
                    <Select
                      value={layoutStyle}
                      onValueChange={(value: any) => setLayoutStyle(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THEATER">Theater (Rows facing front)</SelectItem>
                        <SelectItem value="CIRCULAR">Circular (Around center)</SelectItem>
                        <SelectItem value="U_SHAPE">U-Shape (Conference style)</SelectItem>
                        <SelectItem value="BANQUET">Banquet (Round tables)</SelectItem>
                        <SelectItem value="CLASSROOM">Classroom (Rows of tables)</SelectItem>
                        <SelectItem value="MIXED">Mixed (Optimized combination)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="furniturePreference">Furniture Type</Label>
                    <Select
                      value={furniturePreference}
                      onValueChange={(value: any) => setFurniturePreference(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEWS">Pews (8 seats each)</SelectItem>
                        <SelectItem value="CHAIRS">Individual Chairs</SelectItem>
                        <SelectItem value="TABLES">Tables</SelectItem>
                        <SelectItem value="MIXED">Mixed (Optimized)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Additional Elements */}
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-gray-700">
                    Additional Elements
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeAltar"
                        checked={includeAltar}
                        onChange={(e) => setIncludeAltar(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="includeAltar" className="font-normal cursor-pointer">
                        Include Altar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includePulpit"
                        checked={includePulpit}
                        onChange={(e) => setIncludePulpit(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="includePulpit" className="font-normal cursor-pointer">
                        Include Pulpit
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeSoundDesk"
                        checked={includeSoundDesk}
                        onChange={(e) => setIncludeSoundDesk(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="includeSoundDesk" className="font-normal cursor-pointer">
                        Include Sound Desk
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeCamera"
                        checked={includeCamera}
                        onChange={(e) => setIncludeCamera(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="includeCamera" className="font-normal cursor-pointer">
                        Include Camera
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Preview Info */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-700">
                    <strong>Room Size:</strong> {roomLength}ft × {roomWidth}ft ({roomLength * roomWidth} sq ft)
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Target Capacity:</strong> {targetCapacity} seats
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    AI will optimize furniture placement based on your requirements while
                    maintain proper aisle widths and clearances.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAIGeneratorDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={generateAILayout} 
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Layout
                </Button>
              </DialogFooter>
              </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Capacity Counter */}
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200">
          <Users className="w-5 h-5 text-indigo-700" />
          <div>
            <p className="text-xs text-indigo-600 font-medium">Total Capacity</p>
            <p className="text-2xl font-bold text-indigo-900">{totalCapacity}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Furniture Library Sidebar */}
        <Card className="w-full lg:w-64 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Furniture Library</CardTitle>
            <CardDescription>Click to add to canvas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-1">{furnitureButtons}</div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <div
              className="relative bg-white border-4 border-gray-300 rounded-lg overflow-hidden"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                maxWidth: "100%",
                aspectRatio: `${canvasWidth}/${canvasHeight}`,
              }}
            >
              {/* Grid Background */}
              <div
                className="absolute inset-0 z-0 opacity-30"
                style={{
                  backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Items */}
              <div id="canvas-container" className="absolute inset-0">
                {layoutItems.map((item) => (
                  <DraggableFurniture
                    key={item.id}
                    item={item}
                    onStop={updateItemPosition}
                    onRotate={rotateItem}
                    onDelete={deleteItem}
                    onCapacityChange={updateItemCapacity}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground italic">
              Drag items to move. Hover to rotate, delete, or edit capacity. Click furniture
              in the sidebar to add.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
