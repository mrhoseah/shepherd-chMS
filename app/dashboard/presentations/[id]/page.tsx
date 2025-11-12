"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Maximize,
  PenTool,
  Monitor,
  User,
  ArrowLeft,
  Route,
  Copy,
  Layers,
  Grid3x3,
  MousePointer2,
  Box,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Sparkles,
  Clipboard,
  ClipboardCheck,
  RotateCcw,
  RotateCw,
  HelpCircle,
  Download,
  Upload,
  MoreVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  Layout,
  Copy as CopyIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SlideContentRenderer } from "@/components/slide-content-renderer";
import { PresentationCanvas } from "@/components/presentations/presentation-canvas";
import { DraggableSlide } from "@/components/presentations/draggable-slide";
import { PathEditor } from "@/components/presentations/path-editor";
import { useMultiSelect } from "@/components/presentations/multi-select";
import { useKeyboardShortcuts, PRESENTATION_SHORTCUTS } from "@/lib/presentations/keyboard-shortcuts";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { SlideTemplates } from "@/components/presentations/slide-templates";
import { KeyboardShortcutsHelp } from "@/components/presentations/keyboard-shortcuts-help";
import { PreziFrame } from "@/components/presentations/prezi-frame";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Slide {
  id: string;
  title: string;
  content: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  order: number;
  backgroundColor: string | null;
  textColor: string | null;
  metadata?: {
    notes?: string;
    frameType?: "rectangle" | "circle" | "bracket" | "invisible";
    rotation?: number;
    [key: string]: any;
  } | null;
}

interface Presentation {
  id: string;
  title: string;
  description: string | null;
  currentSlideId: string | null;
  presenterUserId: string | null;
  slides: Slide[];
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const CANVAS_SIZE = 1000;
const VIEWPORT_SIZE = 600;

export default function PresentationBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id as string;
  const { toast } = useToast();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    notes: "",
    frameType: "rectangle" as "rectangle" | "circle" | "bracket" | "invisible",
    rotation: 0,
  });

  // Canvas state
  const [zoom, setZoom] = useState(0.4); // Default to 40% zoom for edit mode to show more canvas
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const MIN_ZOOM = 0.1; // 10% - allow very small zoom out
  const MAX_ZOOM = 5; // 500% - allow large zoom in
  const [isDragging, setIsDragging] = useState(false);
  const [draggingSlideId, setDraggingSlideId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, slideX: 0, slideY: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localSlidePositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const draggingSlideIdRef = useRef<string | null>(null);
  
  // WYSIWYG features
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);
  const [alignmentGuides, setAlignmentGuides] = useState<{ x?: number; y?: number }>({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingSlideId, setResizingSlideId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Real-time sync
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Advanced features
  const [showPathEditor, setShowPathEditor] = useState(false);
  const [presentationPath, setPresentationPath] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [copiedSlide, setCopiedSlide] = useState<Slide | null>(null);
  const [history, setHistory] = useState<Presentation[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showPathLines, setShowPathLines] = useState(true);
  const [presentationTheme, setPresentationTheme] = useState<"default" | "dark" | "colorful" | "minimal">("default");
  
  // Multi-select
  const multiSelect = useMultiSelect({
    items: presentation?.slides.map(s => s.id) || [],
    onSelectionChange: (selected) => {
      // Handle multi-select changes
    },
  });

  const fetchPresentation = useCallback(async () => {
    try {
      const res = await fetch(`/api/presentations/${presentationId}`);
      if (res.ok) {
        const data = await res.json();
        setPresentation(data.presentation);
        
        // Update local positions cache
        if (data.presentation.slides) {
          data.presentation.slides.forEach((slide: Slide) => {
            localSlidePositions.current.set(slide.id, { x: slide.x, y: slide.y });
          });
        }
        
        // Auto-center on current slide (only if not dragging)
        if (data.presentation.currentSlideId && data.presentation.slides.length > 0 && !draggingSlideIdRef.current) {
          const currentSlide = data.presentation.slides.find(
            (s: Slide) => s.id === data.presentation.currentSlideId
          );
          if (currentSlide) {
            centerOnSlide(currentSlide);
          }
        } else if (data.presentation.slides.length > 0 && !draggingSlideIdRef.current) {
          // If no current slide, set a reasonable overview zoom to see all slides
          setTimeout(() => {
            const viewportWidth = canvasRef.current?.clientWidth || VIEWPORT_SIZE;
            const viewportHeight = canvasRef.current?.clientHeight || VIEWPORT_SIZE;
            
            // Calculate bounds of all slides
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            data.presentation.slides.forEach((slide: Slide) => {
              minX = Math.min(minX, slide.x);
              minY = Math.min(minY, slide.y);
              maxX = Math.max(maxX, slide.x + slide.width);
              maxY = Math.max(maxY, slide.y + slide.height);
            });
            
            const contentWidth = maxX - minX;
            const contentHeight = maxY - minY;
            const padding = 100; // Padding around content
            
            // Calculate zoom to fit all content
            const zoomX = (viewportWidth - padding * 2) / contentWidth;
            const zoomY = (viewportHeight - padding * 2) / contentHeight;
            const fitZoom = Math.min(zoomX, zoomY); // Use smaller zoom to fit all content
            const overviewZoom = Math.min(Math.max(fitZoom, 0.3), 0.6); // Between 30% and 60% for overview
            
            // Center the content
            const contentCenterX = (minX + maxX) / 2;
            const contentCenterY = (minY + maxY) / 2;
            const viewportCenterX = viewportWidth / 2;
            const viewportCenterY = viewportHeight / 2;
            
            setZoom(overviewZoom);
            setPanX(viewportCenterX - (contentCenterX * overviewZoom));
            setPanY(viewportCenterY - (contentCenterY * overviewZoom));
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error fetching presentation:", error);
    } finally {
      setLoading(false);
    }
  }, [presentationId]);

  useEffect(() => {
    fetchPresentation();
    
    // Set up real-time sync (polling every 2 seconds)
    const interval = setInterval(() => {
      fetchPresentation();
    }, 2000);
    setSyncInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [presentationId, fetchPresentation]);

  const centerOnSlide = (slide: Slide, targetZoom: number = 2.0) => {
    // Get actual viewport dimensions
    const viewportWidth = canvasRef.current?.clientWidth || VIEWPORT_SIZE;
    const viewportHeight = canvasRef.current?.clientHeight || VIEWPORT_SIZE;
    
    // Use target zoom (200% = 2.0) or calculate fit zoom if target is too large
    const padding = 40; // Padding around the slide
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - padding * 2;
    
    const zoomX = availableWidth / slide.width;
    const zoomY = availableHeight / slide.height;
    const fitZoom = Math.min(Math.min(zoomX, zoomY), MAX_ZOOM);
    
    // Use target zoom if it fits, otherwise use fit zoom
    const finalZoom = Math.min(targetZoom, fitZoom);
    
    // Center the slide in the viewport
    const slideCenterX = slide.x + slide.width / 2;
    const slideCenterY = slide.y + slide.height / 2;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    // Calculate pan to center the slide
    const panXValue = viewportCenterX - (slideCenterX * finalZoom);
    const panYValue = viewportCenterY - (slideCenterY * finalZoom);
    
    setPanX(panXValue);
    setPanY(panYValue);
    setZoom(finalZoom);
  };

  const updateCurrentSlide = async (slideId: string) => {
    try {
      await fetch(`/api/presentations/${presentationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSlideId: slideId }),
      });
    } catch (error) {
      console.error("Error updating current slide:", error);
    }
  };

  const handleSlideClick = (slide: Slide, e?: React.MouseEvent) => {
    // Handle multi-select with Ctrl/Cmd
    if (e?.ctrlKey || e?.metaKey) {
      multiSelect.toggle(slide.id);
      return;
    }
    
    // Range select with Shift
    if (e?.shiftKey && multiSelect.selected.length > 0) {
      const currentIndex = presentation?.slides.findIndex(s => s.id === slide.id) ?? -1;
      const lastSelectedIndex = presentation?.slides.findIndex(s => s.id === multiSelect.selected[multiSelect.selected.length - 1]) ?? -1;
      const start = Math.min(currentIndex, lastSelectedIndex);
      const end = Math.max(currentIndex, lastSelectedIndex);
      const range = presentation?.slides.slice(start, end + 1).map(s => s.id) || [];
      range.forEach(id => {
        if (!multiSelect.isSelected(id)) {
          multiSelect.toggle(id);
        }
      });
      return;
    }
    
    // Single select
    multiSelect.select(slide.id);
    updateCurrentSlide(slide.id);
    centerOnSlide(slide);
  };

  const handleAddSlide = async () => {
    try {
      const res = await fetch(`/api/presentations/${presentationId}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Slide ${(presentation?.slides.length || 0) + 1}`,
          content: "Edit this content",
          x: Math.floor(Math.random() * 700) + 100,
          y: Math.floor(Math.random() * 700) + 100,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchPresentation();
        // Set as current slide and center
        updateCurrentSlide(data.slide.id);
        setTimeout(() => centerOnSlide(data.slide), 100);
      }
    } catch (error) {
      console.error("Error adding slide:", error);
      toast({
        title: "Error",
        description: "Failed to add slide",
        variant: "destructive",
      });
    }
  };

  const handleEditSlide = (slide: Slide) => {
    // Create a new object to ensure we're editing only this specific slide
    setEditingSlide({ ...slide });
    setEditFormData({
      title: slide.title,
      content: slide.content || "",
      backgroundColor: slide.backgroundColor || "#ffffff",
      textColor: slide.textColor || "#000000",
      notes: (slide.metadata as any)?.notes || "",
      frameType: (slide.metadata as any)?.frameType || "rectangle",
      rotation: (slide.metadata as any)?.rotation || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveSlide = async () => {
    if (!editingSlide) return;

    setSaving(true);
    try {
      const { notes, frameType, rotation, ...slideData } = editFormData;
      const res = await fetch(
        `/api/presentations/${presentationId}/slides/${editingSlide.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...slideData,
            metadata: {
              ...((editingSlide.metadata as any) || {}),
              notes: notes || undefined,
              frameType: frameType || "rectangle",
              rotation: rotation || 0,
            },
          }),
        }
      );

      if (res.ok) {
        toast({
          title: "Success",
          description: "Slide updated successfully",
        });
        setIsEditDialogOpen(false);
        fetchPresentation();
      } else {
        toast({
          title: "Error",
          description: "Failed to update slide",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update slide",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateSlide = async (slide: Slide) => {
    try {
      const res = await fetch(`/api/presentations/${presentationId}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${slide.title} (Copy)`,
          content: slide.content,
          x: slide.x + 50,
          y: slide.y + 50,
          width: slide.width,
          height: slide.height,
          backgroundColor: slide.backgroundColor,
          textColor: slide.textColor,
          order: presentation?.slides.length || 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchPresentation();
        updateCurrentSlide(data.slide.id);
        setTimeout(() => centerOnSlide(data.slide), 100);
        toast({
          title: "Success",
          description: "Slide duplicated",
        });
      }
    } catch (error) {
      console.error("Error duplicating slide:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate slide",
        variant: "destructive",
      });
    }
  };

  const handleCopySlide = (slide: Slide) => {
    setCopiedSlide(slide);
    toast({
      title: "Copied",
      description: "Slide copied to clipboard",
    });
  };

  const handlePasteSlide = async () => {
    if (!copiedSlide) return;
    
    try {
      const res = await fetch(`/api/presentations/${presentationId}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${copiedSlide.title} (Copy)`,
          content: copiedSlide.content,
          x: copiedSlide.x + 50,
          y: copiedSlide.y + 50,
          width: copiedSlide.width,
          height: copiedSlide.height,
          backgroundColor: copiedSlide.backgroundColor,
          textColor: copiedSlide.textColor,
          order: presentation?.slides.length || 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchPresentation();
        updateCurrentSlide(data.slide.id);
        setTimeout(() => centerOnSlide(data.slide), 100);
        toast({
          title: "Success",
          description: "Slide pasted",
        });
      }
    } catch (error) {
      console.error("Error pasting slide:", error);
      toast({
        title: "Error",
        description: "Failed to paste slide",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (multiSelect.selected.length === 0) return;
    
    if (!confirm(`Delete ${multiSelect.selected.length} slide(s)?`)) return;

    try {
      await Promise.all(
        multiSelect.selected.map((slideId) =>
          fetch(`/api/presentations/${presentationId}/slides/${slideId}`, {
            method: "DELETE",
          })
        )
      );
      
      multiSelect.clearSelection();
      fetchPresentation();
      toast({
        title: "Success",
        description: `${multiSelect.selected.length} slide(s) deleted`,
      });
    } catch (error) {
      console.error("Error deleting slides:", error);
      toast({
        title: "Error",
        description: "Failed to delete slides",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    try {
      const res = await fetch(
        `/api/presentations/${presentationId}/slides/${slideId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        toast({
          title: "Success",
          description: "Slide deleted successfully",
        });
        fetchPresentation();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete slide",
        variant: "destructive",
      });
    }
  };

  // Helper function to snap to grid
  const snapToGridValue = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Helper function to calculate alignment guides
  const calculateAlignmentGuides = useCallback((slide: Slide, newX: number, newY: number): { x?: number; y?: number } => {
    if (!showAlignmentGuides || !presentation) return {};
    
    const guides: { x?: number; y?: number } = {};
    const threshold = 5; // pixels
    
    presentation.slides.forEach((otherSlide) => {
      if (otherSlide.id === slide.id) return;
      
      // Check horizontal alignment (left, center, right)
      if (Math.abs(newX - otherSlide.x) < threshold) {
        guides.x = otherSlide.x;
      } else if (Math.abs(newX + slide.width - (otherSlide.x + otherSlide.width)) < threshold) {
        guides.x = otherSlide.x + otherSlide.width - slide.width;
      } else if (Math.abs(newX + slide.width / 2 - (otherSlide.x + otherSlide.width / 2)) < threshold) {
        guides.x = otherSlide.x + otherSlide.width / 2 - slide.width / 2;
      }
      
      // Check vertical alignment (top, center, bottom)
      if (Math.abs(newY - otherSlide.y) < threshold) {
        guides.y = otherSlide.y;
      } else if (Math.abs(newY + slide.height - (otherSlide.y + otherSlide.height)) < threshold) {
        guides.y = otherSlide.y + otherSlide.height - slide.height;
      } else if (Math.abs(newY + slide.height / 2 - (otherSlide.y + otherSlide.height / 2)) < threshold) {
        guides.y = otherSlide.y + otherSlide.height / 2 - slide.height / 2;
      }
    });
    
    return guides;
  }, [showAlignmentGuides, presentation]);

  // Debounced function to save slide position
  const saveSlidePosition = useCallback(async (slideId: string, x: number, y: number) => {
    // Clear existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    // Update local cache immediately for optimistic UI
    localSlidePositions.current.set(slideId, { x, y });
    
    // Debounce API call
    dragTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/presentations/${presentationId}/slides/${slideId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x, y }),
        });
      } catch (error) {
        console.error("Error saving slide position:", error);
        // Revert on error
        fetchPresentation();
      }
    }, 300); // 300ms debounce
  }, [presentationId, fetchPresentation]);

  // Debounced function to save slide size
  const saveSlideSize = useCallback(async (slideId: string, width: number, height: number) => {
    // Clear existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    // Debounce API call
    dragTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/presentations/${presentationId}/slides/${slideId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ width, height }),
        });
      } catch (error) {
        console.error("Error saving slide size:", error);
        // Revert on error
        fetchPresentation();
      }
    }, 300); // 300ms debounce
  }, [presentationId, fetchPresentation]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, slide: Slide) => {
    // Prevent drag if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[contenteditable]')) {
      return;
    }
    
    // For mouse events, only allow left button
    if ('button' in e && e.button !== 0) return;
    
    // Prevent text selection during drag
    e.preventDefault();
    e.stopPropagation();
    
    // Disable text selection globally during drag
    document.body.style.userSelect = 'none';
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get client coordinates (mouse or touch)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate initial position in canvas coordinates
    const canvasX = (clientX - rect.left - panX) / zoom;
    const canvasY = (clientY - rect.top - panY) / zoom;
    
    setIsDragging(true);
    setDraggingSlideId(slide.id);
    draggingSlideIdRef.current = slide.id;
    setDragStart({
      x: clientX,
      y: clientY,
      slideX: slide.x,
      slideY: slide.y,
    });
    setDragOffset({
      x: canvasX - slide.x,
      y: canvasY - slide.y,
    });
    setAlignmentGuides({});
  };

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingSlideId || !presentation) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    e.preventDefault();
    
    const slide = presentation.slides.find(s => s.id === draggingSlideId);
    if (!slide) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Calculate new position in canvas coordinates
    const canvasX = (clientX - rect.left - panX) / zoom;
    const canvasY = (clientY - rect.top - panY) / zoom;
    
    let newX = canvasX - dragOffset.x;
    let newY = canvasY - dragOffset.y;
    
    // Constrain to canvas bounds
    newX = Math.max(0, Math.min(CANVAS_SIZE - slide.width, newX));
    newY = Math.max(0, Math.min(CANVAS_SIZE - slide.height, newY));
    
    // Calculate alignment guides
    const guides = calculateAlignmentGuides(slide, newX, newY);
    setAlignmentGuides(guides);
    
    // Apply alignment if guides are active
    if (guides.x !== undefined) {
      newX = guides.x;
    }
    if (guides.y !== undefined) {
      newY = guides.y;
    }
    
    // Apply snap to grid
    newX = snapToGridValue(newX);
    newY = snapToGridValue(newY);
    
    // Update local state optimistically
    if (presentation) {
      setPresentation({
        ...presentation,
        slides: presentation.slides.map(s =>
          s.id === draggingSlideId ? { ...s, x: newX, y: newY } : s
        ),
      });
    }
    
    // Save to server (debounced)
    saveSlidePosition(draggingSlideId, newX, newY);
  }, [draggingSlideId, presentation, panX, panY, zoom, dragOffset, snapToGrid, gridSize, calculateAlignmentGuides, saveSlidePosition]);

  const handleDragEnd = useCallback(() => {
    if (!draggingSlideId) return;
    
    const currentSlideId = draggingSlideId;
    setIsDragging(false);
    setDraggingSlideId(null);
    draggingSlideIdRef.current = null;
    setAlignmentGuides({});
    
    // Re-enable text selection
    document.body.style.userSelect = '';
    
    // Ensure final position is saved
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    // Final save
    if (presentation) {
      const slide = presentation.slides.find(s => s.id === currentSlideId);
      if (slide) {
        saveSlidePosition(currentSlideId, slide.x, slide.y);
      }
    }
    
    // Cleanup global event listeners
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', handleDragEnd);
  }, [draggingSlideId, presentation, saveSlidePosition, handleDrag]);

  // Set up global mouse and touch event listeners for dragging
  useEffect(() => {
    if (draggingSlideId) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDrag, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDrag);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggingSlideId, handleDrag, handleDragEnd]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, slide: Slide, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsResizing(true);
    setResizingSlideId(slide.id);
    setResizeHandle(handle);
    setResizeStart({
      x: clientX,
      y: clientY,
      width: slide.width,
      height: slide.height,
    });
  };

  const handleResize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !resizingSlideId || !presentation) return;
    
    e.preventDefault();
    
    const slide = presentation.slides.find(s => s.id === resizingSlideId);
    if (!slide) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const deltaX = (clientX - resizeStart.x) / zoom;
    const deltaY = (clientY - resizeStart.y) / zoom;
    
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    
    // Calculate new dimensions based on resize handle
    switch (resizeHandle) {
      case 'se': // Southeast (bottom-right)
        newWidth = Math.max(100, Math.min(CANVAS_SIZE - slide.x, resizeStart.width + deltaX));
        newHeight = Math.max(60, Math.min(CANVAS_SIZE - slide.y, resizeStart.height + deltaY));
        break;
      case 'sw': // Southwest (bottom-left)
        newWidth = Math.max(100, Math.min(slide.x + resizeStart.width, resizeStart.width - deltaX));
        newHeight = Math.max(60, Math.min(CANVAS_SIZE - slide.y, resizeStart.height + deltaY));
        break;
      case 'ne': // Northeast (top-right)
        newWidth = Math.max(100, Math.min(CANVAS_SIZE - slide.x, resizeStart.width + deltaX));
        newHeight = Math.max(60, Math.min(slide.y + resizeStart.height, resizeStart.height - deltaY));
        break;
      case 'nw': // Northwest (top-left)
        newWidth = Math.max(100, Math.min(slide.x + resizeStart.width, resizeStart.width - deltaX));
        newHeight = Math.max(60, Math.min(slide.y + resizeStart.height, resizeStart.height - deltaY));
        break;
      case 'e': // East (right)
        newWidth = Math.max(100, Math.min(CANVAS_SIZE - slide.x, resizeStart.width + deltaX));
        break;
      case 'w': // West (left)
        newWidth = Math.max(100, Math.min(slide.x + resizeStart.width, resizeStart.width - deltaX));
        break;
      case 's': // South (bottom)
        newHeight = Math.max(60, Math.min(CANVAS_SIZE - slide.y, resizeStart.height + deltaY));
        break;
      case 'n': // North (top)
        newHeight = Math.max(60, Math.min(slide.y + resizeStart.height, resizeStart.height - deltaY));
        break;
    }
    
    // Apply snap to grid
    newWidth = snapToGridValue(newWidth);
    newHeight = snapToGridValue(newHeight);
    
    // Update local state optimistically
    if (presentation) {
      setPresentation({
        ...presentation,
        slides: presentation.slides.map(s =>
          s.id === resizingSlideId ? { ...s, width: newWidth, height: newHeight } : s
        ),
      });
    }
    
    // Save to server (debounced)
    saveSlideSize(resizingSlideId, newWidth, newHeight);
  }, [isResizing, resizingSlideId, presentation, zoom, resizeStart, resizeHandle, snapToGrid, gridSize, saveSlideSize]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;
    
    const currentSlideId = resizingSlideId;
    setIsResizing(false);
    setResizingSlideId(null);
    setResizeHandle(null);
    
    // Ensure final size is saved
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    // Final save
    if (currentSlideId && presentation) {
      const slide = presentation.slides.find(s => s.id === currentSlideId);
      if (slide) {
        saveSlideSize(currentSlideId, slide.width, slide.height);
      }
    }
    
    // Cleanup global event listeners
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.removeEventListener('touchmove', handleResize);
    document.removeEventListener('touchend', handleResizeEnd);
  }, [isResizing, resizingSlideId, presentation, saveSlideSize, handleResize]);

  // Set up global mouse and touch event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResize, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.removeEventListener('touchmove', handleResize);
        document.removeEventListener('touchend', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  const handleCanvasPan = (e: React.MouseEvent) => {
    if (e.button !== 1 && !(e.button === 0 && e.ctrlKey)) return; // Middle mouse or Ctrl+Left
    e.preventDefault();
    // Pan logic would go here
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom if Ctrl/Cmd key is pressed, otherwise allow normal scrolling
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate zoom factor (positive delta = zoom out, negative = zoom in)
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomFactor));
    
    if (newZoom === zoom) return; // No change
    
    // Calculate the point in canvas coordinates before zoom
    const canvasX = (mouseX - panX) / zoom;
    const canvasY = (mouseY - panY) / zoom;
    
    // Calculate new pan to keep the point under the mouse in the same screen position
    const newPanX = mouseX - (canvasX * newZoom);
    const newPanY = mouseY - (canvasY * newZoom);
    
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  };

  const currentSlide = presentation?.slides.find(
    (s) => s.id === presentation.currentSlideId
  );
  const currentSlideIndex = presentation?.slides.findIndex(
    (s) => s.id === presentation.currentSlideId
  ) ?? -1;

  const handleNext = () => {
    if (presentation && currentSlideIndex < presentation.slides.length - 1) {
      const nextSlide = presentation.slides[currentSlideIndex + 1];
      updateCurrentSlide(nextSlide.id);
      centerOnSlide(nextSlide);
    }
  };

  const handlePrev = () => {
    if (presentation && currentSlideIndex > 0) {
      const prevSlide = presentation.slides[currentSlideIndex - 1];
      updateCurrentSlide(prevSlide.id);
      centerOnSlide(prevSlide);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (canvasRef.current?.requestFullscreen) {
        canvasRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (currentSlide) {
        setTimeout(() => centerOnSlide(currentSlide), 100);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [currentSlide]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...PRESENTATION_SHORTCUTS.SAVE,
      action: () => {
        // Save presentation
        toast({ title: "Saved", description: "Presentation saved" });
      },
    },
    {
      ...PRESENTATION_SHORTCUTS.NEW_SLIDE,
      action: handleAddSlide,
    },
    {
      ...PRESENTATION_SHORTCUTS.DELETE,
      action: () => {
        if (currentSlide) {
          handleDeleteSlide(currentSlide.id);
        }
      },
    },
    {
      ...PRESENTATION_SHORTCUTS.ZOOM_IN,
      action: () => setZoom(Math.min(MAX_ZOOM, zoom + 0.1)),
    },
    {
      ...PRESENTATION_SHORTCUTS.ZOOM_OUT,
      action: () => setZoom(Math.max(MIN_ZOOM, zoom - 0.1)),
    },
    {
      ...PRESENTATION_SHORTCUTS.ZOOM_RESET,
      action: () => {
        setZoom(1);
        setPanX(0);
        setPanY(0);
      },
    },
    {
      ...PRESENTATION_SHORTCUTS.FIT_TO_SCREEN,
      action: () => {
        if (currentSlide) {
          centerOnSlide(currentSlide);
        }
      },
    },
    {
      ...PRESENTATION_SHORTCUTS.PREV_SLIDE,
      action: handlePrev,
    },
    {
      ...PRESENTATION_SHORTCUTS.NEXT_SLIDE,
      action: handleNext,
    },
    {
      ...PRESENTATION_SHORTCUTS.SELECT_ALL,
      action: () => multiSelect.selectAll(),
    },
    {
      ...PRESENTATION_SHORTCUTS.COPY,
      action: () => {
        if (currentSlide) {
          handleCopySlide(currentSlide);
        }
      },
    },
    {
      ...PRESENTATION_SHORTCUTS.PASTE,
      action: handlePasteSlide,
    },
    {
      ...PRESENTATION_SHORTCUTS.DUPLICATE,
      action: () => {
        if (currentSlide) {
          handleDuplicateSlide(currentSlide);
        }
      },
    },
  ]);

  // Handle path updates
  const handlePathChange = async (newPath: string[]) => {
    setPresentationPath(newPath);
    // Update slide order based on path
    try {
      for (let i = 0; i < newPath.length; i++) {
        await fetch(`/api/presentations/${presentationId}/slides/${newPath[i]}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: i }),
        });
      }
      fetchPresentation();
      toast({
        title: "Success",
        description: "Presentation path updated",
      });
    } catch (error) {
      console.error("Error updating path:", error);
      toast({
        title: "Error",
        description: "Failed to update path",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl font-medium text-gray-700 dark:text-gray-300">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
            <Eye className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-xl font-medium text-gray-700 dark:text-gray-300">Presentation not found</p>
          <Button onClick={() => router.push("/dashboard/documents")} className="mt-4 shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Minimal Header - Prezi Style */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/dashboard/documents")} 
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {presentation.title}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="h-8 px-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Link href={`/dashboard/presentations/${presentationId}/view`}>
              Present
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/presentations/${presentationId}`} target="_blank">
                  <Eye className="w-4 h-4 mr-2" />
                  View Public Link
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const url = `${window.location.origin}/presentations/${presentationId}`;
                  await navigator.clipboard.writeText(url);
                  toast({
                    title: "Copied!",
                    description: "Public link copied to clipboard",
                  });
                }}
              >
                <Clipboard className="w-4 h-4 mr-2" />
                Copy Public Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/presentations/${presentationId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        isPublic: !presentation?.isPublic,
                      }),
                    });
                    if (res.ok) {
                      fetchPresentation();
                      toast({
                        title: "Success",
                        description: presentation?.isPublic
                          ? "Presentation is now private"
                          : "Presentation is now public",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to update visibility",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {presentation?.isPublic ? (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Make Private
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Make Public
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Canvas Area - Prezi Style */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-gray-50 dark:bg-gray-900">
        {/* Floating Toolbar - Prezi Style */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newZoom = Math.max(MIN_ZOOM, zoom - 0.1);
                  setZoom(newZoom);
                }}
                disabled={zoom <= MIN_ZOOM}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono w-20 text-center text-gray-700 dark:text-gray-300" title="Use Ctrl+Wheel to zoom">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newZoom = Math.min(MAX_ZOOM, zoom + 0.1);
                  setZoom(newZoom);
                }}
                disabled={zoom >= MAX_ZOOM}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setZoom(1);
                  setPanX(0);
                  setPanY(0);
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 ml-1"
                title="Reset Zoom (100%)"
              >
                <span className="text-xs">100%</span>
              </Button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentSlide) {
                    centerOnSlide(currentSlide);
                  }
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Fit to Screen"
              >
                <Maximize className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Maximize2 className="w-4 h-4 rotate-180" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <div className="flex items-center gap-2 px-2">
                <Label htmlFor="snap-grid" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  Snap
                </Label>
                <Switch
                  id="snap-grid"
                  checked={snapToGrid}
                  onCheckedChange={setSnapToGrid}
                  className="scale-75"
                />
              </div>
              <div className="flex items-center gap-2 px-2">
                <Label htmlFor="align-guides" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  Guides
                </Label>
                <Switch
                  id="align-guides"
                  checked={showAlignmentGuides}
                  onCheckedChange={setShowAlignmentGuides}
                  className="scale-75"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleAddSlide}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Slide
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowTemplates(true)}>
                    <Layout className="w-4 h-4 mr-2" />
                    From Template
                  </DropdownMenuItem>
                  {copiedSlide && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handlePasteSlide}>
                        <ClipboardCheck className="w-4 h-4 mr-2" />
                        Paste Slide
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {multiSelect.count > 0 && (
                <>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({multiSelect.count})
                  </Button>
                </>
              )}
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcutsHelp(true)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Keyboard Shortcuts"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 min-h-0 relative">
          <PresentationCanvas
            items={presentation.slides.map(s => s.id)}
            onDragStart={(e) => {
              const slideId = e.active.id as string;
              const slide = presentation.slides.find(s => s.id === slideId);
              if (slide) {
                setDraggingSlideId(slideId);
                setIsDragging(true);
              }
            }}
            onDragEnd={(e) => {
              setDraggingSlideId(null);
              setIsDragging(false);
            }}
          >
          <div
            ref={canvasRef}
            className="relative w-full h-full overflow-hidden bg-white dark:bg-gray-950"
            onMouseDown={handleCanvasPan}
            onWheel={handleWheel}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <div
              className="absolute transition-transform duration-200 ease-out"
              style={{
                width: `${CANVAS_SIZE}px`,
                height: `${CANVAS_SIZE}px`,
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                transformOrigin: "0 0",
                willChange: "transform",
              }}
            >
              {/* Canvas grid background - subtle professional grid */}
              {snapToGrid && (
                <div
                  className="absolute inset-0 opacity-15 dark:opacity-8 transition-opacity duration-300"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #64748b 1px, transparent 1px),
                      linear-gradient(to bottom, #64748b 1px, transparent 1px)
                    `,
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    backgroundPosition: '0 0',
                  }}
                />
              )}
              
              {/* Subtle center crosshair for alignment */}
              <div className="absolute inset-0 pointer-events-none">
                <div 
                  className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/5 dark:bg-blue-500/5"
                  style={{ transform: 'translateX(-50%)' }}
                />
                <div 
                  className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/5 dark:bg-blue-500/5"
                  style={{ transform: 'translateY(-50%)' }}
                />
              </div>

              {/* Alignment Guides */}
              {isDragging && (alignmentGuides.x !== undefined || alignmentGuides.y !== undefined) && (
                <>
                  {alignmentGuides.x !== undefined && (
                    <div
                      className="absolute z-50 pointer-events-none"
                      style={{
                        left: `${alignmentGuides.x}px`,
                        top: 0,
                        width: '2px',
                        height: `${CANVAS_SIZE}px`,
                        backgroundColor: '#3b82f6',
                        boxShadow: '0 0 4px rgba(59, 130, 246, 0.8)',
                      }}
                    />
                  )}
                  {alignmentGuides.y !== undefined && (
                    <div
                      className="absolute z-50 pointer-events-none"
                      style={{
                        left: 0,
                        top: `${alignmentGuides.y}px`,
                        width: `${CANVAS_SIZE}px`,
                        height: '2px',
                        backgroundColor: '#3b82f6',
                        boxShadow: '0 0 4px rgba(59, 130, 246, 0.8)',
                      }}
                    />
                  )}
                </>
              )}

              {/* Slides */}
              {presentation.slides.map((slide) => {
                const isCurrent = slide.id === presentation.currentSlideId;
                const isDraggingThis = draggingSlideId === slide.id;
                const frameType = (slide.metadata as any)?.frameType || "rectangle";
                const rotation = (slide.metadata as any)?.rotation || 0;
                const slideRotation = isDraggingThis ? rotation + 1 : rotation;
                
                return (
                  <div
                    key={slide.id}
                    className={`absolute transition-all duration-300 ease-out ${
                      isDraggingThis
                        ? "cursor-grabbing z-50 opacity-90 scale-105 shadow-2xl"
                        : "cursor-move z-0"
                    } ${
                      isCurrent && !isDraggingThis
                        ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 shadow-2xl shadow-blue-500/30 scale-110 z-10"
                        : multiSelect.isSelected(slide.id) && !isDraggingThis
                        ? "ring-4 ring-purple-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 shadow-2xl shadow-purple-500/30 scale-105 z-10"
                        : !isDraggingThis
                        ? "ring-2 ring-gray-300 dark:ring-gray-600 shadow-lg hover:ring-blue-400 hover:shadow-xl hover:scale-[1.02]"
                        : ""
                    }`}
                    style={{
                      left: `${slide.x}px`,
                      top: `${slide.y}px`,
                      transform: `rotate(${slideRotation}deg)`,
                      transformOrigin: "center center",
                    }}
                    onClick={(e) => {
                      if (!draggingSlideId) {
                        handleSlideClick(slide);
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!isResizing) {
                        handleDragStart(e, slide);
                      }
                    }}
                    onTouchStart={(e) => {
                      if (!isResizing) {
                        handleDragStart(e, slide);
                      }
                    }}
                  >
                    <PreziFrame
                      frameType={frameType}
                      width={slide.width}
                      height={slide.height}
                      rotation={0}
                      backgroundColor={slide.backgroundColor || "#ffffff"}
                      borderColor={isCurrent ? "#3b82f6" : "#e5e7eb"}
                      className={`h-full flex flex-col relative ${isDraggingThis ? 'cursor-grabbing' : 'cursor-grab'}`}
                    >
                      <div className={`p-4 h-full flex flex-col bg-gradient-to-br from-white via-white to-gray-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/30 backdrop-blur-sm relative shadow-lg overflow-hidden`}>
                      {/* Selection indicator */}
                      {multiSelect.isSelected(slide.id) && !isCurrent && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center z-50 shadow-lg border-2 border-white dark:border-gray-900">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg truncate flex-1 drop-shadow-sm text-gray-900 dark:text-white">{slide.title}</h3>
                        {isCurrent && !isDraggingThis && (
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSlide(slide);
                              }}
                              title="Edit Slide"
                            >
                              <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySlide(slide);
                              }}
                              title="Copy Slide"
                            >
                              <Copy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateSlide(slide);
                              }}
                              title="Duplicate Slide"
                            >
                              <CopyIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlide(slide.id);
                              }}
                              title="Delete Slide"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <SlideContentRenderer
                        content={slide.content}
                        isDragging={isDraggingThis}
                        className="min-h-[60px]"
                        slideWidth={slide.width}
                        slideHeight={slide.height}
                      />
                      {isCurrent && !isDraggingThis && (
                        <Badge className="mt-2 w-fit bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            Current
                          </span>
                        </Badge>
                      )}
                      
                      {/* Resize Handles - Only show on current slide when not dragging */}
                      {isCurrent && !isDraggingThis && !isResizing && (
                        <>
                          {/* Corner handles */}
                          <div
                            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize hover:bg-blue-600 hover:scale-125 transition-transform z-50"
                            onMouseDown={(e) => handleResizeStart(e, slide, 'nw')}
                            onTouchStart={(e) => handleResizeStart(e, slide, 'nw')}
                            title="Resize"
                          />
                          <div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize hover:bg-blue-600 hover:scale-125 transition-transform z-50"
                            onMouseDown={(e) => handleResizeStart(e, slide, 'ne')}
                            onTouchStart={(e) => handleResizeStart(e, slide, 'ne')}
                            title="Resize"
                          />
                          <div
                            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize hover:bg-blue-600 hover:scale-125 transition-transform z-50"
                            onMouseDown={(e) => handleResizeStart(e, slide, 'sw')}
                            onTouchStart={(e) => handleResizeStart(e, slide, 'sw')}
                            title="Resize"
                          />
                          <div
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize hover:bg-blue-600 hover:scale-125 transition-transform z-50"
                            onMouseDown={(e) => handleResizeStart(e, slide, 'se')}
                            onTouchStart={(e) => handleResizeStart(e, slide, 'se')}
                            title="Resize"
                          />
                          {/* Edge handles */}
                          <div
                            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize hover:bg-blue-600 hover:scale-125 transition-transform z-50"
                            onMouseDown={(e) => handleResizeStart(e, slide, 'n')}
                            onTouchStart={(e) => handleResizeStart(e, slide, 'n')}
                            title="Resize"
                          />
                          <div
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize hover:bg-blue-600 hover:scale-125 transition-transform z-50"
                            onMouseDown={(e) => handleResizeStart(e, slide, 's')}
                            onTouchStart={(e) => handleResizeStart(e, slide, 's')}
                            title="Resize"
                          />
                          <div
                            className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize hover:bg-blue-600 hover:scale-125 transition-transform z-50"
                            onMouseDown={(e) => handleResizeStart(e, slide, 'w')}
                            onTouchStart={(e) => handleResizeStart(e, slide, 'w')}
                            title="Resize"
                          />
                          <div
                            className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize hover:bg-blue-600 hover:scale-125 transition-transform z-50"
                            onMouseDown={(e) => handleResizeStart(e, slide, 'e')}
                            onTouchStart={(e) => handleResizeStart(e, slide, 'e')}
                            title="Resize"
                          />
                        </>
                      )}
                      </div>
                    </PreziFrame>
                  </div>
                );
              })}
            </div>

            {/* Current slide indicator - Prezi style minimal */}
            {currentSlide && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md shadow-lg z-10">
                <span className="font-medium">{currentSlide.title}</span>
                <span className="mx-2 text-gray-400 dark:text-gray-600">•</span>
                <span className="text-gray-300 dark:text-gray-700">
                  {currentSlideIndex + 1} / {presentation.slides.length}
                </span>
              </div>
            )}
            
            {/* Multi-select indicator - Prezi style */}
            {multiSelect.count > 1 && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md shadow-lg z-10">
                {multiSelect.count} selected
              </div>
            )}
          </div>
          </PresentationCanvas>
        </div>
        
        {/* Slide Thumbnails Bottom Bar - Prezi Style */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center px-4 overflow-x-auto">
          <div className="flex gap-2 items-center">
            {presentation.slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => {
                  updateCurrentSlide(slide.id);
                  centerOnSlide(slide);
                }}
                className={`min-w-[80px] h-16 p-2 border rounded cursor-pointer transition-all flex-shrink-0 ${
                  slide.id === presentation.currentSlideId
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                    : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {index + 1}
                </div>
                <div className="text-[9px] font-medium text-gray-900 dark:text-gray-100 truncate">
                  {slide.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Slide Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">Edit Slide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            <div className="space-y-2">
              <Label htmlFor="slideTitle" className="text-sm font-semibold">Title *</Label>
              <Input
                id="slideTitle"
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
                className="text-sm sm:text-base"
                placeholder="Enter slide title..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slideContent" className="text-sm font-semibold">Content</Label>
              <div className="border rounded-lg overflow-hidden">
                <RichTextEditor
                  content={editFormData.content}
                  onChange={(content) =>
                    setEditFormData({ ...editFormData, content })
                  }
                  placeholder="Enter slide content..."
                  className="dark:text-gray-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backgroundColor" className="text-sm font-semibold">Background Color</Label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={editFormData.backgroundColor}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-12 h-10 sm:w-16 cursor-pointer flex-shrink-0"
                  />
                  <Input
                    type="text"
                    value={editFormData.backgroundColor}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="flex-1 font-mono text-xs sm:text-sm min-w-0"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="textColor" className="text-sm font-semibold">Text Color</Label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Input
                    id="textColor"
                    type="color"
                    value={editFormData.textColor}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        textColor: e.target.value,
                      })
                    }
                    className="w-12 h-10 sm:w-16 cursor-pointer flex-shrink-0"
                  />
                  <Input
                    type="text"
                    value={editFormData.textColor}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        textColor: e.target.value,
                      })
                    }
                    className="flex-1 font-mono text-xs sm:text-sm min-w-0"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frameType" className="text-sm font-semibold">Frame Type</Label>
                <Select
                  value={editFormData.frameType}
                  onValueChange={(value: "rectangle" | "circle" | "bracket" | "invisible") =>
                    setEditFormData({ ...editFormData, frameType: value })
                  }
                >
                  <SelectTrigger id="frameType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="bracket">Bracket</SelectItem>
                    <SelectItem value="invisible">Invisible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rotation" className="text-sm font-semibold">Rotation (degrees)</Label>
                <Input
                  id="rotation"
                  type="number"
                  min="-180"
                  max="180"
                  step="1"
                  value={editFormData.rotation}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      rotation: parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slideNotes" className="text-sm font-semibold">Speaker Notes</Label>
              <Textarea
                id="slideNotes"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                placeholder="Add speaker notes for this slide..."
                className="min-h-[80px] sm:min-h-[100px] resize-y text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                These notes are only visible to you during editing and won't be shown to viewers.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="shadow-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSlide} disabled={saving} className="shadow-sm w-full sm:w-auto">
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Path Editor */}
      {presentation && (
        <PathEditor
          slides={presentation.slides}
          path={presentationPath.length > 0 ? presentationPath : presentation.slides.map(s => s.id)}
          onPathChange={handlePathChange}
          open={showPathEditor}
          onOpenChange={setShowPathEditor}
        />
      )}

      {/* Slide Templates */}
      <SlideTemplates
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onSelectTemplate={async (template) => {
          try {
            const res = await fetch(`/api/presentations/${presentationId}/slides`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: template.title,
                content: template.content,
                x: Math.floor(Math.random() * 600) + 100,
                y: Math.floor(Math.random() * 600) + 100,
                width: template.width,
                height: template.height,
                backgroundColor: template.backgroundColor,
                textColor: template.textColor,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              fetchPresentation();
              updateCurrentSlide(data.slide.id);
              setTimeout(() => centerOnSlide(data.slide), 100);
              toast({
                title: "Success",
                description: "Slide created from template",
              });
            }
          } catch (error) {
            console.error("Error creating slide from template:", error);
            toast({
              title: "Error",
              description: "Failed to create slide",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={showShortcutsHelp}
        onOpenChange={setShowShortcutsHelp}
      />
    </div>
  );
}

