"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Eye,
  Minimize2,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3x3,
  Home,
  MoreVertical,
  Settings,
  Share2,
  Type,
  Minus,
  Plus,
  Copy,
  Check,
  Palette,
  Sparkles,
  Layers,
  Map,
  Route,
  RotateCw,
  Box,
  FileText,
  MousePointer2,
  PenTool,
  Download,
  Video,
  Clock,
  Mic,
  Monitor,
  MonitorSpeaker,
  Command,
  Search,
  X,
  Save,
  Image as ImageIcon,
  FileVideo,
  Music,
  Presentation,
  FileDown,
  FileUp,
  Wand2,
  Sparkle,
} from "lucide-react";

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
  notes?: string | null;
  transitionType?: "fade" | "slide" | "zoom" | "none";
}

interface Presentation {
  id: string;
  title: string;
  description: string | null;
  currentSlideId: string | null;
  presenterUserId: string | null;
  isPublic: boolean;
  slides: Slide[];
  createdBy?: {
    id: string;
  } | null;
  createdById?: string;
}

const CANVAS_SIZE = 1000;
const VIEWPORT_SIZE = 600;


export default function PresentationViewPage() {
  const params = useParams();
  const presentationId = params.id as string;
  const { toast } = useToast();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mouseActivity, setMouseActivity] = useState(true);
  const [fontSize, setFontSize] = useState(1);
  const [showOverview, setShowOverview] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [backgroundType, setBackgroundType] = useState<"interactive" | "plain" | "dots" | "hexagon" | "radial" | "paper" | "stars" | "circuit">("interactive");
  const [showConnectionLines, setShowConnectionLines] = useState(true);
  
  // features
  const [rotation, setRotation] = useState(0); // Rotation angle in degrees
  const [transitionSpeed, setTransitionSpeed] = useState(1500); // Transition duration in ms
  const [transitionEasing, setTransitionEasing] = useState<"ease-in-out" | "ease-out" | "ease-in" | "linear">("ease-in-out");
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showPathPreview, setShowPathPreview] = useState(false);
  const [zoomDepth, setZoomDepth] = useState(1); // Zoom depth multiplier
  const [enableRotation, setEnableRotation] = useState(false);
  const [enable3D, setEnable3D] = useState(false);
  
  // Advanced presentation features
  const [showPresenterNotes, setShowPresenterNotes] = useState(false);
  const [showThumbnailsSidebar, setShowThumbnailsSidebar] = useState(false);
  const [laserPointerEnabled, setLaserPointerEnabled] = useState(false);
  const [laserPointerPos, setLaserPointerPos] = useState({ x: 0, y: 0 });
  const [showLaserPointer, setShowLaserPointer] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawings, setDrawings] = useState<Array<{ id: string; path: string; color: string }>>([]);
  const [currentDrawing, setCurrentDrawing] = useState<string>("");
  const [drawingColor, setDrawingColor] = useState("#ef4444");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [presenterView, setPresenterView] = useState(false);
  const [slideTransition, setSlideTransition] = useState<"fade" | "slide" | "zoom" | "none">("fade");
  const [showNextSlidePreview, setShowNextSlidePreview] = useState(true);
  const [showPresentDialog, setShowPresentDialog] = useState(false);
  const [presenterFullscreenMode, setPresenterFullscreenMode] = useState<"fullscreen" | "windowed">("windowed");
  const [showSlideThumbnails, setShowSlideThumbnails] = useState(true); // Show thumbnails in presenter view
  
  // Viewer settings (controlled by presenter)
  const [showSlideRing, setShowSlideRing] = useState(true);
  const [viewerSize, setViewerSize] = useState<"responsive" | "1920x1080">("responsive");
  const [viewerCountdown, setViewerCountdown] = useState(0); // Countdown timer for viewers (seconds)
  const [viewerAnimation, setViewerAnimation] = useState<"countdown" | "pulse" | "wave" | "spinner" | "particles" | "gradient">("pulse");
  
  // Timer state
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(0); // Track initial time for progress calculation
  const [warningThresholdMinutes, setWarningThresholdMinutes] = useState(5); // Default 5 minutes
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // User and presenter state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPresenter, setIsPresenter] = useState(false);
  
  // Draggable timer state
  const [timerPosition, setTimerPosition] = useState({ x: 20, y: 100 });
  const [isDraggingTimer, setIsDraggingTimer] = useState(false);
  const timerRef = useRef<HTMLDivElement>(null);
  
  // Check if timer is in warning zone
  const warningThresholdSeconds = warningThresholdMinutes * 60;
  const isWarningZone = timeRemaining > 0 && timeRemaining <= warningThresholdSeconds;
  const isCriticalZone = timeRemaining > 0 && timeRemaining <= 60;

  // Add CSS keyframes for timer glow animations
  useEffect(() => {
    const styleId = 'timer-glow-animations';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes criticalGlow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.2);
        }
        50% {
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.6), 0 0 90px rgba(239, 68, 68, 0.4);
        }
      }
      @keyframes warningGlow {
        0%, 100% {
          box-shadow: 0 0 15px rgba(234, 179, 8, 0.5), 0 0 30px rgba(234, 179, 8, 0.3), 0 0 45px rgba(234, 179, 8, 0.1);
        }
        50% {
          box-shadow: 0 0 25px rgba(234, 179, 8, 0.7), 0 0 50px rgba(234, 179, 8, 0.5), 0 0 75px rgba(234, 179, 8, 0.3);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  
  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Timer functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (timeRemaining === 0) {
      // Initialize timer from minutes and seconds
      const totalSeconds = timerMinutes * 60 + timerSeconds;
      setTimeRemaining(totalSeconds);
      setInitialTimerSeconds(totalSeconds);
    } else if (initialTimerSeconds === 0) {
      // If timer was reset, set initial time
      setInitialTimerSeconds(timeRemaining);
    }
    setTimerRunning(true);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    const totalSeconds = timerMinutes * 60 + timerSeconds;
    setTimeRemaining(totalSeconds);
    setInitialTimerSeconds(totalSeconds);
  };

  // Timer countdown effect
  useEffect(() => {
    if (timerRunning && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerRunning, timeRemaining]);

  // Initialize timer when minutes/seconds change and timer is not running
  useEffect(() => {
    if (!timerRunning && timerEnabled) {
      const totalSeconds = timerMinutes * 60 + timerSeconds;
      setTimeRemaining((prev) => {
        // Only update if the value actually changed to avoid unnecessary resets
        if (prev !== totalSeconds) {
          setInitialTimerSeconds(totalSeconds);
          return totalSeconds;
        }
        return prev;
      });
    }
  }, [timerMinutes, timerSeconds, timerEnabled, timerRunning]);

  // Calculate timer progress percentage
  const timerProgress = initialTimerSeconds > 0 
    ? ((initialTimerSeconds - timeRemaining) / initialTimerSeconds) * 100 
    : 0;
  
  // Calculate circumference for circular progress (radius = 40, so circumference = 2 * π * 40 ≈ 251.33)
  const CIRCLE_RADIUS = 40;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const progressOffset = CIRCLE_CIRCUMFERENCE - (timerProgress / 100) * CIRCLE_CIRCUMFERENCE;

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const user = await res.json();
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchPresentation();
    
    // Set up real-time sync (polling every 1 second for viewer)
    const interval = setInterval(() => {
      fetchPresentation();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [presentationId]);

  // Update presenter status when presentation or user changes
  useEffect(() => {
    if (presentation && currentUserId) {
      // User is presenter if they're the creator or the assigned presenter
      const isCreator = presentation.createdBy?.id === currentUserId || presentation.createdById === currentUserId;
      const isAssignedPresenter = presentation.presenterUserId === currentUserId;
      setIsPresenter(isCreator || isAssignedPresenter);
    } else {
      setIsPresenter(false);
    }
  }, [presentation, currentUserId]);

  // Auto-hide controls in presentation mode OR for viewers
  useEffect(() => {
    const shouldAutoHide = presentationMode || (!isPresenter && !presentationMode);
    
    if (shouldAutoHide) {
      const handleMouseMove = () => {
        setShowControls(true);
        setMouseActivity(true);
        
        if (mouseTimeoutRef.current) {
          clearTimeout(mouseTimeoutRef.current);
        }
        
        mouseTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
          setMouseActivity(false);
        }, 3000);
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        if (mouseTimeoutRef.current) {
          clearTimeout(mouseTimeoutRef.current);
        }
      };
    } else {
      setShowControls(true);
    }
  }, [presentationMode, isPresenter]);

  const fetchPresentation = async () => {
    try {
      const res = await fetch(`/api/presentations/${presentationId}`);
      if (res.ok) {
        const data = await res.json();
        setPresentation(data.presentation);
        setIsPublic(data.presentation.isPublic || false);
        
        // Update viewer settings from presentation data
        if (data.presentation.showSlideRing !== undefined) {
          setShowSlideRing(data.presentation.showSlideRing);
        }
        if (data.presentation.viewerSize !== undefined) {
          setViewerSize(data.presentation.viewerSize);
        }
        if (data.presentation.backgroundType !== undefined) {
          setBackgroundType(data.presentation.backgroundType as typeof backgroundType);
        }
        if (data.presentation.viewerCountdown !== undefined) {
          setViewerCountdown(data.presentation.viewerCountdown);
        }
        
        // Auto-center on current slide
        if (data.presentation.currentSlideId && data.presentation.slides.length > 0) {
          const currentSlide = data.presentation.slides.find(
            (s: Slide) => s.id === data.presentation.currentSlideId
          );
          if (currentSlide) {
            centerOnSlide(currentSlide);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching presentation:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublicStatus = async (newPublicStatus: boolean) => {
    try {
      const res = await fetch(`/api/presentations/${presentationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newPublicStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setPresentation(data.presentation);
        setIsPublic(newPublicStatus);
        toast({
          title: newPublicStatus ? "Presentation is now public" : "Presentation is now private",
          description: newPublicStatus 
            ? "Anyone with the link can view this presentation in real-time."
            : "Only you can access this presentation now.",
        });
      } else {
        toast({
          title: "Failed to update",
          description: "Could not change presentation visibility.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating presentation:", error);
      toast({
        title: "Error",
        description: "Failed to update presentation visibility.",
        variant: "destructive",
      });
    }
  };

  const updateViewerSettings = async (settings: { showSlideRing?: boolean; viewerSize?: "responsive" | "1920x1080"; backgroundType?: string; viewerCountdown?: number; viewerAnimation?: string }) => {
    try {
      const res = await fetch(`/api/presentations/${presentationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        setPresentation(data.presentation);
        if (settings.showSlideRing !== undefined) {
          setShowSlideRing(settings.showSlideRing);
        }
        if (settings.viewerSize !== undefined) {
          setViewerSize(settings.viewerSize);
        }
        if (settings.backgroundType !== undefined) {
          setBackgroundType(settings.backgroundType as typeof backgroundType);
        }
        if (settings.viewerCountdown !== undefined) {
          setViewerCountdown(settings.viewerCountdown);
        }
        if (settings.viewerAnimation !== undefined) {
          setViewerAnimation(settings.viewerAnimation as typeof viewerAnimation);
        }
        toast({
          title: "Viewer settings updated",
          description: "Viewer settings have been updated and will sync to all viewers.",
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: "Failed to update",
          description: errorData.error || "Could not update viewer settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error updating viewer settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update viewer settings. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const getShareLink = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/presentations/${presentationId}`;
    }
    return "";
  };

  const copyShareLink = async () => {
    const link = getShareLink();
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with others to view the presentation in real-time.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const centerOnSlide = (slide: Slide, immediate = false) => {
    // Get actual viewport dimensions
    const viewportWidth = canvasRef.current?.clientWidth || VIEWPORT_SIZE;
    const viewportHeight = canvasRef.current?.clientHeight || VIEWPORT_SIZE;
    
    // Calculate zoom to fill the viewport with generous padding
    const padding = presentationMode || isFullscreen ? 40 : 60;
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - padding * 2;
    
    const zoomX = availableWidth / slide.width;
    const zoomY = availableHeight / slide.height;
    // Use the smaller zoom to fit entirely (Prezi-style), but allow more zoom range
    const fitZoom = Math.min(Math.min(zoomX, zoomY), 4) * zoomDepth;
    
    // Center the slide in the viewport
    const slideCenterX = slide.x + slide.width / 2;
    const slideCenterY = slide.y + slide.height / 2;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    // Calculate pan to center the slide
    const panXValue = viewportCenterX - (slideCenterX * fitZoom);
    const panYValue = viewportCenterY - (slideCenterY * fitZoom);
    
    // rotation effect (subtle rotation when enabled)
    const newRotation = enableRotation ? (Math.random() * 2 - 1) * 2 : 0; // ±2 degrees
    
    setPanX(panXValue);
    setPanY(panYValue);
    setZoom(fitZoom);
    if (enableRotation) {
      setRotation(newRotation);
    }
  };

  const showAllSlides = () => {
    if (!presentation) return;
    
    const viewportWidth = canvasRef.current?.clientWidth || VIEWPORT_SIZE;
    const viewportHeight = canvasRef.current?.clientHeight || VIEWPORT_SIZE;
    
    // Calculate bounds of all slides
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    presentation.slides.forEach(slide => {
      minX = Math.min(minX, slide.x);
      minY = Math.min(minY, slide.y);
      maxX = Math.max(maxX, slide.x + slide.width);
      maxY = Math.max(maxY, slide.y + slide.height);
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;
    
    // Calculate zoom to show all slides with padding
    const padding = 100;
    const zoomX = (viewportWidth - padding * 2) / contentWidth;
    const zoomY = (viewportHeight - padding * 2) / contentHeight;
    const overviewZoom = Math.min(zoomX, zoomY, 1);
    
    // Center on all content
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    setPanX(viewportCenterX - (contentCenterX * overviewZoom));
    setPanY(viewportCenterY - (contentCenterY * overviewZoom));
    setZoom(overviewZoom);
    setShowOverview(true);
  };

  const currentSlide = presentation?.slides.find(
    (s) => s.id === presentation.currentSlideId
  );
  const currentSlideIndex = presentation?.slides.findIndex(
    (s) => s.id === presentation.currentSlideId
  ) ?? -1;

  const sortedSlides = presentation?.slides.sort((a, b) => a.order - b.order) || [];

  const goToSlide = useCallback(async (slideId: string) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setShowOverview(false);
    
    try {
      const res = await fetch(`/api/presentations/${presentationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSlideId: slideId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPresentation(data.presentation);
        const slide = data.presentation.slides.find((s: Slide) => s.id === slideId);
        if (slide) {
          centerOnSlide(slide);
        }
      }
    } catch (error) {
      console.error("Error updating current slide:", error);
    } finally {
      setTimeout(() => setIsTransitioning(false), transitionSpeed);
    }
  }, [presentationId, isTransitioning, transitionSpeed]);

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0 && sortedSlides.length > 0 && !isTransitioning) {
      const prevSlide = sortedSlides[currentSlideIndex - 1];
      goToSlide(prevSlide.id);
    }
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < sortedSlides.length - 1 && sortedSlides.length > 0 && !isTransitioning) {
      const nextSlide = sortedSlides[currentSlideIndex + 1];
      goToSlide(nextSlide.id);
    }
  };

  // Keyboard navigation - Always active, especially in presentation mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPreviousSlide();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        if (showOverview) {
          if (currentSlide) {
            centerOnSlide(currentSlide);
          }
          setShowOverview(false);
        } else if (isFullscreen) {
          // Only exit fullscreen, don't stop presentation mode
          toggleFullscreen();
        }
        // Don't stop presentation mode on ESC - only "Stop" button should stop it
      } else if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        if (showOverview && currentSlide) {
          centerOnSlide(currentSlide);
          setShowOverview(false);
        } else {
          showAllSlides();
        }
      } else if (e.key === "h" || e.key === "H" || e.key === "Home") {
        e.preventDefault();
        if (sortedSlides.length > 0) {
          goToSlide(sortedSlides[0].id);
        }
      } else if (e.key === "+" || e.key === "=") {
        if (e.shiftKey) {
          e.preventDefault();
          setFontSize((prev) => Math.min(2, prev + 0.1));
        } else {
          e.preventDefault();
          setZoom((prev) => Math.min(4, prev + 0.3));
        }
      } else if (e.key === "-" || e.key === "_") {
        if (e.shiftKey) {
          e.preventDefault();
          setFontSize((prev) => Math.max(0.5, prev - 0.1));
        } else {
          e.preventDefault();
          setZoom((prev) => Math.max(0.3, prev - 0.3));
        }
      } else if (e.key === "0") {
        e.preventDefault();
        if (currentSlide) {
          centerOnSlide(currentSlide);
        }
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setShowMiniMap((prev) => !prev);
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setShowPathPreview((prev) => !prev);
      }
    };

    // Always listen for keyboard events, especially in presentation mode
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentSlideIndex, sortedSlides, goToSlide, isFullscreen, presentationMode, currentSlide, showOverview, isTransitioning, setShowMiniMap, setShowPathPreview]);

  // Swipe gesture handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchEndY.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) {
      return;
    }

    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (!isVerticalSwipe) {
      if (isLeftSwipe) {
        // Swipe left = next slide
        goToNextSlide();
      } else if (isRightSwipe) {
        // Swipe right = previous slide
        goToPreviousSlide();
      }
    }

    // Reset touch positions
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  // Handle timer drag
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const handleTimerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = timerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
      setIsDraggingTimer(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTimer || !dragStartRef.current) return;
      
      const newX = e.clientX - dragStartRef.current.offsetX;
      const newY = e.clientY - dragStartRef.current.offsetY;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const timerWidth = 150;
      const timerHeight = 120;
      
      const constrainedX = Math.max(0, Math.min(newX, viewportWidth - timerWidth));
      const constrainedY = Math.max(0, Math.min(newY, viewportHeight - timerHeight));
      
      setTimerPosition({ x: constrainedX, y: constrainedY });
    };

    const handleMouseUp = () => {
      setIsDraggingTimer(false);
      dragStartRef.current = null;
    };

    if (isDraggingTimer) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingTimer]);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Try different fullscreen methods for cross-browser support
        const element = canvasRef.current || document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          // IE/Edge
          await (element as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  // Auto-enter fullscreen when presentation mode starts (only if fullscreen mode selected)
  useEffect(() => {
    if (presentationMode && !isFullscreen && presenterFullscreenMode === "fullscreen") {
      // Small delay to ensure UI is ready
      const timer = setTimeout(async () => {
        try {
          const element = canvasRef.current || document.documentElement;
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if ((element as any).webkitRequestFullscreen) {
            await (element as any).webkitRequestFullscreen();
          } else if ((element as any).mozRequestFullScreen) {
            await (element as any).mozRequestFullScreen();
          } else if ((element as any).msRequestFullscreen) {
            await (element as any).msRequestFullscreen();
          }
        } catch (error) {
          console.error("Error entering fullscreen:", error);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    // Always return a cleanup function (no-op if condition is false)
    return () => {};
  }, [presentationMode, isFullscreen, presenterFullscreenMode]);

  const handleStartPresentation = () => {
    setShowPresentDialog(true);
  };

  const handlePresentConfirm = async (mode: "fullscreen" | "windowed") => {
    setPresenterFullscreenMode(mode);
    setPresentationMode(true);
    setShowPresentDialog(false);
    
    // Update isPresenting status in database
    try {
      await fetch(`/api/presentations/${presentationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPresenting: true }),
      });
    } catch (error) {
      console.error("Error updating presentation status:", error);
    }
    
    // Auto-start timer if enabled when Present is clicked
    if (timerEnabled) {
      const totalSeconds = timerMinutes * 60 + timerSeconds;
      
      if (totalSeconds > 0) {
        // Always initialize timer when Present is clicked (reset to configured time)
        setTimeRemaining(totalSeconds);
        setInitialTimerSeconds(totalSeconds);
        
        // Start timer immediately
        setTimeout(() => {
          setTimerRunning(true);
        }, 100);
      } else if (timeRemaining > 0) {
        // If timer was already set but minutes/seconds are 0, just start it
        if (initialTimerSeconds === 0) {
          setInitialTimerSeconds(timeRemaining);
        }
        if (!timerRunning) {
          setTimeout(() => {
            setTimerRunning(true);
          }, 100);
        }
      }
    }
  };

  const handleStopPresentation = async () => {
    setPresentationMode(false);
    
    // Update isPresenting status in database
    try {
      await fetch(`/api/presentations/${presentationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPresenting: false }),
      });
    } catch (error) {
      console.error("Error updating presentation status:", error);
    }
    
    // Pause timer when stopping presentation
    if (timerRunning) {
      pauseTimer();
    }
    // Exit fullscreen if in fullscreen mode
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check all possible fullscreen states for cross-browser support
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
      
      // Don't exit presentation mode when exiting fullscreen
      // Presentation mode should only be stopped by clicking "Stop" button
      // This allows presenters to exit fullscreen without stopping the presentation
      
      if (currentSlide) {
        setTimeout(() => centerOnSlide(currentSlide), 100);
      }
    };

    // Listen to all possible fullscreen change events
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [currentSlide, presentationMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-white">Loading presentation</p>
            <p className="text-sm text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto border border-red-500/30">
            <Eye className="w-10 h-10 text-red-400" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-white">Presentation not found</p>
            <p className="text-sm text-gray-400">The presentation you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get container background class based on settings
  const getContainerBg = () => {
    if (backgroundType === "plain") {
      return "bg-black";
    }
    // All other backgrounds use gradient container
    return "bg-gradient-to-br from-gray-950 via-black to-gray-900";
  };

  return (
    <div 
      className={`${getContainerBg()} text-white ${
        presentationMode || isFullscreen 
          ? "fixed inset-0 w-screen h-screen overflow-hidden z-[9999]" 
          : "w-full h-screen overflow-hidden flex flex-col"
      }`}
      style={
        presentationMode || isFullscreen 
          ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 } 
          : { height: '100vh', maxHeight: '100vh' }
      }
    >
      {/* Professional Header - Only show when not in presentation mode */}
      {!presentationMode && !isFullscreen && (
        <div className="flex-shrink-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-1.5 min-w-0">
                <h1 className="text-2xl font-bold text-white tracking-tight truncate">{presentation.title}</h1>
                {presentation.description && (
                  <p className="text-sm text-gray-400 max-w-2xl truncate">{presentation.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {/* Present/Stop Button Dialog */}
                <Dialog open={showPresentDialog} onOpenChange={setShowPresentDialog}>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <Presentation className="w-5 h-5" />
                        Start Presentation
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Choose how you want to present
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-white text-sm font-semibold">Display Mode</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant={presenterFullscreenMode === "windowed" ? "default" : "outline"}
                            onClick={() => handlePresentConfirm("windowed")}
                            className={`h-auto py-4 flex flex-col items-center gap-2 ${
                              presenterFullscreenMode === "windowed" 
                                ? "bg-blue-600 hover:bg-blue-700" 
                                : "bg-gray-800 hover:bg-gray-700"
                            }`}
                          >
                            <Monitor className="w-6 h-6" />
                            <span className="text-sm font-semibold">Windowed</span>
                            <span className="text-xs text-gray-300">Keep window visible</span>
                          </Button>
                          <Button
                            variant={presenterFullscreenMode === "fullscreen" ? "default" : "outline"}
                            onClick={() => handlePresentConfirm("fullscreen")}
                            className={`h-auto py-4 flex flex-col items-center gap-2 ${
                              presenterFullscreenMode === "fullscreen" 
                                ? "bg-blue-600 hover:bg-blue-700" 
                                : "bg-gray-800 hover:bg-gray-700"
                            }`}
                          >
                            <Maximize className="w-6 h-6" />
                            <span className="text-sm font-semibold">Fullscreen</span>
                            <span className="text-xs text-gray-300">Full screen mode</span>
                          </Button>
                        </div>
                      </div>
                      {timerEnabled && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-sm text-blue-300">
                            ⏱️ Timer will start automatically when you begin presenting
                          </p>
                        </div>
                      )}
                      
                      {/* Viewer Countdown Timer */}
                      <div className="space-y-2 pt-2 border-t border-gray-700">
                        <Label className="text-white text-sm font-semibold">Viewer Countdown (seconds)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="300"
                          value={viewerCountdown}
                          onChange={(e) => {
                            const value = Math.max(0, Math.min(300, parseInt(e.target.value) || 0));
                            setViewerCountdown(value);
                            updateViewerSettings({ viewerCountdown: value });
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400">
                          Set a countdown timer for viewers while waiting (0 = no countdown)
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gradient-to-b from-gray-900 to-gray-950 border-gray-700/50 text-white max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                    <DialogHeader className="pb-4 border-b border-gray-700/50">
                      <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-600/20">
                          <Palette className="w-5 h-5 text-blue-400" />
                        </div>
                        Presentation Settings
                      </DialogTitle>
                      <DialogDescription className="text-gray-400 mt-2">
                        Customize the appearance and behavior of your presentation
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 mt-6">
                      {/* Background Type */}
                      <div className="space-y-4 p-5 bg-gray-800/30 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                        <div className="space-y-1">
                          <Label className="text-white text-base font-semibold flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                            Canvas Background Style
                          </Label>
                          <p className="text-sm text-gray-400 ml-3">
                            Choose a background pattern for your presentation canvas
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <Button
                            variant={backgroundType === "interactive" ? "default" : "outline"}
                            onClick={() => {
                              setBackgroundType("interactive");
                              updateViewerSettings({ backgroundType: "interactive" });
                            }}
                            className={`${backgroundType === "interactive" ? "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"} h-auto py-3 flex flex-col items-center gap-2 transition-all duration-200`}
                          >
                            <div className="w-12 h-12 rounded border border-white/20 flex items-center justify-center" style={{
                              backgroundImage: `
                                linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
                              `,
                              backgroundSize: '8px 8px'
                            }} />
                            <span className="text-xs">Grid</span>
                          </Button>
                          
                          <Button
                            variant={backgroundType === "dots" ? "default" : "outline"}
                            onClick={() => {
                              setBackgroundType("dots");
                              updateViewerSettings({ backgroundType: "dots" });
                            }}
                            className={`${backgroundType === "dots" ? "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"} h-auto py-3 flex flex-col items-center gap-2 transition-all duration-200`}
                          >
                            <div className="w-12 h-12 rounded border border-white/20 flex items-center justify-center" style={{
                              backgroundImage: 'radial-gradient(circle, rgba(59,130,246,0.4) 1.5px, transparent 1.5px)',
                              backgroundSize: '8px 8px'
                            }} />
                            <span className="text-xs">Dots</span>
                          </Button>
                          
                          <Button
                            variant={backgroundType === "hexagon" ? "default" : "outline"}
                            onClick={() => {
                              setBackgroundType("hexagon");
                              updateViewerSettings({ backgroundType: "hexagon" });
                            }}
                            className={`${backgroundType === "hexagon" ? "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"} h-auto py-3 flex flex-col items-center gap-2 transition-all duration-200`}
                          >
                            <div className="w-12 h-12 rounded border border-white/20 flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24">
                                <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="none" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
                              </svg>
                            </div>
                            <span className="text-xs">Hexagon</span>
                          </Button>
                          
                          <Button
                            variant={backgroundType === "radial" ? "default" : "outline"}
                            onClick={() => {
                              setBackgroundType("radial");
                              updateViewerSettings({ backgroundType: "radial" });
                            }}
                            className={`${backgroundType === "radial" ? "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"} h-auto py-3 flex flex-col items-center gap-2 transition-all duration-200`}
                          >
                            <div className="w-12 h-12 rounded border border-white/20 flex items-center justify-center" style={{
                              background: `
                                radial-gradient(circle at center, rgba(59,130,246,0.3) 0%, transparent 70%),
                                #1a1a1a
                              `
                            }} />
                            <span className="text-xs">Radial</span>
                          </Button>
                          
                          <Button
                            variant={backgroundType === "paper" ? "default" : "outline"}
                            onClick={() => {
                              setBackgroundType("paper");
                              updateViewerSettings({ backgroundType: "paper" });
                            }}
                            className={`${backgroundType === "paper" ? "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"} h-auto py-3 flex flex-col items-center gap-2 transition-all duration-200`}
                          >
                            <div className="w-12 h-12 rounded border border-white/20 flex items-center justify-center" style={{
                              backgroundImage: `
                                repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(59,130,246,0.2) 1px, rgba(59,130,246,0.2) 2px),
                                repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(59,130,246,0.2) 1px, rgba(59,130,246,0.2) 2px)
                              `,
                              backgroundSize: '6px 6px'
                            }} />
                            <span className="text-xs">Paper</span>
                          </Button>
                          
                          <Button
                            variant={backgroundType === "stars" ? "default" : "outline"}
                            onClick={() => {
                              setBackgroundType("stars");
                              updateViewerSettings({ backgroundType: "stars" });
                            }}
                            className={`${backgroundType === "stars" ? "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"} h-auto py-3 flex flex-col items-center gap-2 transition-all duration-200`}
                          >
                            <div className="w-12 h-12 rounded border border-white/20 flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24">
                                <circle cx="6" cy="6" r="1" fill="rgba(59,130,246,0.6)"/>
                                <circle cx="12" cy="8" r="0.5" fill="rgba(147,51,234,0.6)"/>
                                <circle cx="18" cy="5" r="1.5" fill="rgba(59,130,246,0.5)"/>
                                <circle cx="8" cy="16" r="0.8" fill="rgba(236,72,153,0.6)"/>
                                <circle cx="16" cy="18" r="1" fill="rgba(59,130,246,0.6)"/>
                              </svg>
                            </div>
                            <span className="text-xs">Stars</span>
                          </Button>
                          
                          <Button
                            variant={backgroundType === "circuit" ? "default" : "outline"}
                            onClick={() => {
                              setBackgroundType("circuit");
                              updateViewerSettings({ backgroundType: "circuit" });
                            }}
                            className={`${backgroundType === "circuit" ? "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"} h-auto py-3 flex flex-col items-center gap-2 transition-all duration-200`}
                          >
                            <div className="w-12 h-12 rounded border border-white/20 flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24">
                                <path d="M 0,12 L 24,12 M 12,0 L 12,24" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
                                <circle cx="12" cy="12" r="2" fill="rgba(59,130,246,0.5)"/>
                                <circle cx="0" cy="12" r="1.5" fill="rgba(59,130,246,0.4)"/>
                                <circle cx="24" cy="12" r="1.5" fill="rgba(59,130,246,0.4)"/>
                              </svg>
                            </div>
                            <span className="text-xs">Circuit</span>
                          </Button>
                          
                          <Button
                            variant={backgroundType === "plain" ? "default" : "outline"}
                            onClick={() => {
                              setBackgroundType("plain");
                              updateViewerSettings({ backgroundType: "plain" });
                            }}
                            className={`${backgroundType === "plain" ? "bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"} h-auto py-3 flex flex-col items-center gap-2 transition-all duration-200`}
                          >
                            <div className="w-12 h-12 rounded border border-white/20 bg-black" />
                            <span className="text-xs">Plain</span>
                          </Button>
                        </div>
                      </div>

                      {/* Connection Lines */}
                      <div className="flex items-center justify-between p-5 bg-gray-800/30 rounded-xl border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/40 transition-colors duration-200">
                        <div className="space-y-1 flex-1">
                          <Label htmlFor="lines-toggle" className="text-white font-medium flex items-center gap-2">
                            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                              Connection Lines
                            </Label>
                          <p className="text-sm text-gray-400 ml-3">
                            Show lines connecting slides in overview and path preview modes
                            </p>
                          </div>
                          <Switch
                            id="lines-toggle"
                            checked={showConnectionLines}
                            onCheckedChange={setShowConnectionLines}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500"
                        />
                      </div>

                      {/* Viewer Settings - Only for presenter */}
                      {isPresenter && (
                        <div className="space-y-5 p-5 bg-gradient-to-br from-blue-950/30 to-purple-950/30 rounded-xl border border-blue-700/30 backdrop-blur-sm">
                          <div className="space-y-1">
                            <Label className="text-white text-base font-semibold flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-blue-600/20">
                                <Eye className="w-4 h-4 text-blue-400" />
                              </div>
                              Viewer Settings
                            </Label>
                            <p className="text-sm text-gray-400 ml-8">
                              Control how viewers see the presentation
                            </p>
                          </div>
                          
                          {/* Show Slide Ring */}
                          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:bg-gray-800/40 transition-colors">
                            <div className="space-y-1 flex-1">
                              <Label htmlFor="slide-ring-toggle" className="text-white font-medium">
                                Show Blue Ring on Current Slide
                              </Label>
                              <p className="text-sm text-gray-400">
                                Display blue ring highlight around current slide for viewers
                              </p>
                            </div>
                            <Switch
                              id="slide-ring-toggle"
                              checked={showSlideRing}
                              onCheckedChange={(checked) => {
                                setShowSlideRing(checked);
                                updateViewerSettings({ showSlideRing: checked });
                              }}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500"
                            />
                          </div>

                          {/* Viewer Size */}
                          <div className="space-y-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                            <Label className="text-white text-sm font-medium">Viewer Display Size</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={viewerSize === "responsive" ? "default" : "outline"}
                                onClick={() => {
                                  setViewerSize("responsive");
                                  updateViewerSettings({ viewerSize: "responsive" });
                                }}
                                className={`text-xs transition-all duration-200 ${viewerSize === "responsive" ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"}`}
                              >
                                Responsive
                              </Button>
                              <Button
                                variant={viewerSize === "1920x1080" ? "default" : "outline"}
                                onClick={() => {
                                  setViewerSize("1920x1080");
                                  updateViewerSettings({ viewerSize: "1920x1080" });
                                }}
                                className={`text-xs transition-all duration-200 ${viewerSize === "1920x1080" ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"}`}
                              >
                                1920×1080
                              </Button>
                            </div>
                            <p className="text-xs text-gray-400 italic">
                              {viewerSize === "responsive" 
                                ? "Viewers see presentation sized to their device screen" 
                                : "Viewers see presentation in fixed 1920×1080 format (centered)"}
                            </p>
                          </div>

                          {/* Viewer Waiting Animation */}
                          <div className="space-y-3 pt-3 border-t border-gray-700/50">
                            <div className="space-y-1">
                              <Label className="text-white text-sm font-semibold">Waiting Screen Animation</Label>
                              <p className="text-xs text-gray-400">
                                Choose animation template for viewers while waiting
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant={viewerAnimation === "pulse" ? "default" : "outline"}
                                onClick={() => {
                                  setViewerAnimation("pulse");
                                  updateViewerSettings({ viewerAnimation: "pulse" });
                                }}
                                className={`h-auto py-2.5 flex flex-col items-center gap-1.5 text-xs transition-all duration-200 ${
                                  viewerAnimation === "pulse" ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-blue-500/30 animate-pulse"></div>
                                <span>Pulse</span>
                              </Button>
                              <Button
                                variant={viewerAnimation === "countdown" ? "default" : "outline"}
                                onClick={() => {
                                  setViewerAnimation("countdown");
                                  updateViewerSettings({ viewerAnimation: "countdown" });
                                }}
                                className={`h-auto py-2 flex flex-col items-center gap-1 text-xs ${
                                  viewerAnimation === "countdown" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 hover:bg-gray-700"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                  <span className="text-xs font-bold">10</span>
                                </div>
                                <span>Countdown</span>
                              </Button>
                              <Button
                                variant={viewerAnimation === "wave" ? "default" : "outline"}
                                onClick={() => {
                                  setViewerAnimation("wave");
                                  updateViewerSettings({ viewerAnimation: "wave" });
                                }}
                                className={`h-auto py-2 flex flex-col items-center gap-1 text-xs ${
                                  viewerAnimation === "wave" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 hover:bg-gray-700"
                                }`}
                              >
                                <div className="w-8 h-8 flex items-end justify-center gap-0.5">
                                  <div className="w-1 bg-blue-500 h-2 animate-pulse"></div>
                                  <div className="w-1 bg-blue-500 h-4 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-1 bg-blue-500 h-6 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="w-1 bg-blue-500 h-4 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                                  <div className="w-1 bg-blue-500 h-2 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                                <span>Wave</span>
                              </Button>
                              <Button
                                variant={viewerAnimation === "spinner" ? "default" : "outline"}
                                onClick={() => {
                                  setViewerAnimation("spinner");
                                  updateViewerSettings({ viewerAnimation: "spinner" });
                                }}
                                className={`h-auto py-2 flex flex-col items-center gap-1 text-xs ${
                                  viewerAnimation === "spinner" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 hover:bg-gray-700"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                <span>Spinner</span>
                              </Button>
                              <Button
                                variant={viewerAnimation === "particles" ? "default" : "outline"}
                                onClick={() => {
                                  setViewerAnimation("particles");
                                  updateViewerSettings({ viewerAnimation: "particles" });
                                }}
                                className={`h-auto py-2 flex flex-col items-center gap-1 text-xs ${
                                  viewerAnimation === "particles" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 hover:bg-gray-700"
                                }`}
                              >
                                <div className="w-8 h-8 relative">
                                  <div className="absolute top-1 left-1 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                                  <div className="absolute top-3 right-2 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="absolute bottom-2 left-3 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                                <span>Particles</span>
                              </Button>
                              <Button
                                variant={viewerAnimation === "gradient" ? "default" : "outline"}
                                onClick={() => {
                                  setViewerAnimation("gradient");
                                  updateViewerSettings({ viewerAnimation: "gradient" });
                                }}
                                className={`h-auto py-2 flex flex-col items-center gap-1 text-xs ${
                                  viewerAnimation === "gradient" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 hover:bg-gray-700"
                                }`}
                              >
                                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse"></div>
                                <span>Gradient</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      <div className="space-y-5 p-5 bg-gray-800/30 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                        <div className="space-y-1">
                          <Label className="text-white text-base font-semibold flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-purple-600/20">
                              <Box className="w-4 h-4 text-purple-400" />
                            </div>
                            Advanced Features
                          </Label>
                          <p className="text-sm text-gray-400 ml-8">
                            Enable Prezi-like presentation features
                          </p>
                        </div>
                        
                        {/* Path Preview */}
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:bg-gray-800/40 transition-colors">
                          <div className="space-y-1 flex-1">
                            <Label htmlFor="path-preview-toggle" className="text-white font-medium flex items-center gap-2">
                              <Route className="w-4 h-4 text-purple-400" />
                              Path Preview
                            </Label>
                            <p className="text-sm text-gray-400">
                              Show animated path between slides
                            </p>
                          </div>
                          <Switch
                            id="path-preview-toggle"
                            checked={showPathPreview}
                            onCheckedChange={setShowPathPreview}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500"
                          />
                        </div>

                        {/* Mini-Map */}
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:bg-gray-800/40 transition-colors">
                          <div className="space-y-1 flex-1">
                            <Label htmlFor="minimap-toggle" className="text-white font-medium flex items-center gap-2">
                              <Map className="w-4 h-4 text-purple-400" />
                              Mini-Map Navigator
                            </Label>
                            <p className="text-sm text-gray-400">
                              Show navigator map in corner
                            </p>
                          </div>
                          <Switch
                            id="minimap-toggle"
                            checked={showMiniMap}
                            onCheckedChange={setShowMiniMap}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500"
                          />
                        </div>

                        {/* Rotation Effect */}
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:bg-gray-800/40 transition-colors">
                          <div className="space-y-1 flex-1">
                            <Label htmlFor="rotation-toggle" className="text-white font-medium flex items-center gap-2">
                              <RotateCw className="w-4 h-4 text-purple-400" />
                              Rotation Effect
                            </Label>
                            <p className="text-sm text-gray-400">
                              Add subtle rotation during transitions
                            </p>
                          </div>
                          <Switch
                            id="rotation-toggle"
                            checked={enableRotation}
                            onCheckedChange={setEnableRotation}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500"
                          />
                        </div>

                        {/* 3D Perspective */}
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:bg-gray-800/40 transition-colors">
                          <div className="space-y-1 flex-1">
                            <Label htmlFor="3d-toggle" className="text-white font-medium flex items-center gap-2">
                              <Box className="w-4 h-4 text-purple-400" />
                              3D Perspective
                            </Label>
                            <p className="text-sm text-gray-400">
                              Enable 3D transform effects
                            </p>
                          </div>
                          <Switch
                            id="3d-toggle"
                            checked={enable3D}
                            onCheckedChange={setEnable3D}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500"
                          />
                        </div>

                        {/* Transition Speed */}
                        <div className="space-y-3 pt-3 border-t border-gray-700/50 p-3 bg-gray-800/20 rounded-lg">
                          <Label className="text-white text-sm font-medium">Transition Speed (ms)</Label>
                          <Input
                            type="number"
                            min="500"
                            max="3000"
                            step="100"
                            value={transitionSpeed}
                            onChange={(e) => setTransitionSpeed(Math.max(500, Math.min(3000, parseInt(e.target.value) || 1500)))}
                            className="bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                          />
                          <p className="text-xs text-gray-400 italic">
                            Current: {transitionSpeed}ms ({transitionSpeed < 1000 ? 'Fast' : transitionSpeed > 2000 ? 'Slow' : 'Normal'})
                          </p>
                        </div>

                        {/* Transition Easing */}
                        <div className="space-y-3 p-3 bg-gray-800/20 rounded-lg">
                          <Label className="text-white text-sm font-medium">Transition Easing</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['ease-in-out', 'ease-out', 'ease-in', 'linear'] as const).map((ease) => (
                              <Button
                                key={ease}
                                variant={transitionEasing === ease ? "default" : "outline"}
                                onClick={() => setTransitionEasing(ease)}
                                className={`text-xs transition-all duration-200 ${transitionEasing === ease ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600"}`}
                              >
                                {ease}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Zoom Depth */}
                        <div className="space-y-3 p-3 bg-gray-800/20 rounded-lg">
                          <Label className="text-white text-sm font-medium">Zoom Depth Multiplier</Label>
                          <Input
                            type="number"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={zoomDepth}
                            onChange={(e) => setZoomDepth(Math.max(0.5, Math.min(2, parseFloat(e.target.value) || 1)))}
                            className="bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                          />
                          <p className="text-xs text-gray-400 italic">
                            Adjusts zoom level during transitions (1.0 = normal)
                          </p>
                        </div>
                      </div>

                      {/* Timer Settings */}
                      <div className="space-y-5 p-5 bg-gray-800/30 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                        <div className="space-y-1">
                          <Label className="text-white text-base font-semibold flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-green-600/20">
                              <Clock className="w-4 h-4 text-green-400" />
                            </div>
                              Presentation Timer
                            </Label>
                          <p className="text-sm text-gray-400 ml-8">
                              Display a countdown timer during presentation
                            </p>
                          </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:bg-gray-800/40 transition-colors">
                          <Label htmlFor="timer-toggle" className="text-white font-medium cursor-pointer">
                            Enable Timer
                          </Label>
                          <Switch
                            id="timer-toggle"
                            checked={timerEnabled}
                            onCheckedChange={setTimerEnabled}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500"
                          />
                        </div>
                        
                        {timerEnabled && (
                          <div className="space-y-4 pt-4 border-t border-gray-700/50 p-4 bg-gray-800/20 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-white text-sm font-medium">Minutes</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={timerMinutes}
                                  onChange={(e) => setTimerMinutes(Math.max(0, Math.min(120, parseInt(e.target.value) || 0)))}
                                  className="bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-white text-sm font-medium">Seconds</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={timerSeconds}
                                  onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                  className="bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={startTimer}
                                disabled={timerRunning}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Start
                              </Button>
                              <Button
                                onClick={pauseTimer}
                                disabled={!timerRunning}
                                variant="outline"
                                className="flex-1 bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Pause
                              </Button>
                              <Button
                                onClick={resetTimer}
                                variant="outline"
                                className="flex-1 bg-gray-800/50 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600 text-white transition-all duration-200"
                              >
                                Reset
                              </Button>
                            </div>
                            
                            {/* Warning Threshold Setting */}
                            <div className="space-y-3 pt-4 border-t border-gray-700/50">
                              <div className="space-y-2">
                                <Label className="text-white text-sm font-medium">Warning Threshold (minutes)</Label>
                                <p className="text-xs text-gray-400 italic">
                                  Timer will glow when remaining time reaches this threshold
                                </p>
                                <Input
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={warningThresholdMinutes}
                                  onChange={(e) => setWarningThresholdMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 5)))}
                                  className="bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                                />
                              </div>
                            </div>
                            
                            {timeRemaining > 0 && (
                              <div className="text-center p-4 bg-blue-950/30 rounded-lg border border-blue-700/30">
                                <p className="text-xs text-gray-400 mb-2">Current Time</p>
                                <div className="text-3xl font-mono font-bold text-blue-400">
                                  {formatTime(timeRemaining)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">Share Presentation</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Share this presentation with others for real-time viewing
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="public-toggle" className="text-white">
                            Make presentation public
                          </Label>
                          <p className="text-sm text-gray-400">
                            Anyone with the link can view this presentation in real-time
                          </p>
                        </div>
                        <Switch
                          id="public-toggle"
                          checked={isPublic}
                          onCheckedChange={togglePublicStatus}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                      
                      {isPublic && (
                        <div className="space-y-2">
                          <Label className="text-white">Share Link</Label>
                          <div className="flex gap-2">
                            <Input
                              value={getShareLink()}
                              readOnly
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                            <Button
                              onClick={copyShareLink}
                              size="icon"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {linkCopied ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400">
                            Share this link with viewers. They'll see slides update in real-time as you present.
                          </p>
                        </div>
                      )}
                      
                      {!isPublic && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-sm text-yellow-400">
                            This presentation is private. Enable public sharing to generate a shareable link.
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={showAllSlides}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Overview
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMiniMap(!showMiniMap)}
                  className={`${showMiniMap ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/20'} text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300`}
                  title="Toggle Mini-Map (M)"
                >
                  <Map className="w-4 h-4 mr-2" />
                  Map
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPathPreview(!showPathPreview)}
                  className={`${showPathPreview ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/20'} text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300`}
                  title="Toggle Path Preview (P)"
                >
                  <Route className="w-4 h-4 mr-2" />
                  Path
                </Button>
                
                {!presentationMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartPresentation}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 border-0 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/30 transition-all duration-300"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Present
                </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopPresentation}
                    className="bg-gradient-to-r from-red-600 to-red-500 border-0 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/30 transition-all duration-300"
                  >
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Area - Full screen in presentation mode, contained otherwise */}
      <div
        className={`relative flex-1 min-h-0 ${
          presentationMode || isFullscreen 
            ? "w-full h-full" 
            : "w-full"
        }`}
        ref={canvasRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={
          presentationMode || isFullscreen 
            ? { width: '100vw', height: '100vh' } 
            : {}
        }
      >
        <div
          className="absolute inset-0 transition-all"
          style={{
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            transform: enable3D
              ? `translate3d(${panX}px, ${panY}px, 0) scale(${zoom}) rotate(${rotation}deg)`
              : `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "0 0",
            transformStyle: enable3D ? 'preserve-3d' : 'flat',
            transitionDuration: `${transitionSpeed}ms`,
            transitionTimingFunction: transitionEasing,
            willChange: 'transform',
            perspective: enable3D ? '1000px' : 'none',
          }}
        >
          {/* Canvas Backgrounds - Multiple options */}
          {backgroundType === "interactive" && (
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `
                linear-gradient(rgba(59,130,246,0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }} />
          )}
          
          {backgroundType === "dots" && (
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'radial-gradient(circle, rgba(59,130,246,0.3) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              backgroundPosition: '0 0, 15px 15px'
            }} />
          )}
          
          {backgroundType === "hexagon" && (
            <div className="absolute inset-0 opacity-[0.03]">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="hexagon" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                    <polygon points="30,0 60,13 60,39 30,52 0,39 0,13" fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hexagon)" />
              </svg>
            </div>
          )}
          
          {backgroundType === "radial" && (
            <div className="absolute inset-0 opacity-[0.05]" style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(59,130,246,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(147,51,234,0.1) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(236,72,153,0.05) 0%, transparent 50%),
                #000000
              `
            }} />
          )}
          
          {backgroundType === "paper" && (
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.1) 2px, rgba(59,130,246,0.1) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(59,130,246,0.1) 2px, rgba(59,130,246,0.1) 4px)
              `,
              backgroundSize: '40px 40px'
            }} />
          )}
          
          {backgroundType === "stars" && (
            <div className="absolute inset-0 opacity-[0.06]">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="stars" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1" fill="rgba(59,130,246,0.4)"/>
                    <circle cx="50" cy="30" r="0.5" fill="rgba(147,51,234,0.4)"/>
                    <circle cx="80" cy="15" r="1.5" fill="rgba(59,130,246,0.3)"/>
                    <circle cx="30" cy="70" r="0.8" fill="rgba(236,72,153,0.4)"/>
                    <circle cx="70" cy="80" r="1" fill="rgba(59,130,246,0.4)"/>
                    <circle cx="90" cy="60" r="0.6" fill="rgba(147,51,234,0.3)"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#stars)" />
              </svg>
            </div>
          )}
          
          {backgroundType === "circuit" && (
            <div className="absolute inset-0 opacity-[0.03]">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="circuit" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="80" height="80" fill="none"/>
                    <path d="M 0,40 L 80,40 M 40,0 L 40,80" stroke="rgba(59,130,246,0.2)" strokeWidth="1"/>
                    <circle cx="40" cy="40" r="3" fill="rgba(59,130,246,0.3)"/>
                    <circle cx="0" cy="40" r="2" fill="rgba(59,130,246,0.2)"/>
                    <circle cx="80" cy="40" r="2" fill="rgba(59,130,246,0.2)"/>
                    <circle cx="40" cy="0" r="2" fill="rgba(59,130,246,0.2)"/>
                    <circle cx="40" cy="80" r="2" fill="rgba(59,130,246,0.2)"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#circuit)" />
              </svg>
            </div>
          )}
          
          {backgroundType === "plain" && (
            <div className="absolute inset-0 bg-black"></div>
          )}

          {/* Connection Lines / Path Preview between slides */}
          {(showOverview || showPathPreview) && showConnectionLines && sortedSlides.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
              {sortedSlides.slice(0, -1).map((slide, index) => {
                const nextSlide = sortedSlides[index + 1];
                const x1 = slide.x + slide.width / 2;
                const y1 = slide.y + slide.height / 2;
                const x2 = nextSlide.x + nextSlide.width / 2;
                const y2 = nextSlide.y + nextSlide.height / 2;
                const isCurrentPath = slide.id === presentation.currentSlideId;
                
                // curved path
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const curveOffset = 30;
                const cp1x = midX + curveOffset;
                const cp1y = midY - curveOffset;
                const cp2x = midX - curveOffset;
                const cp2y = midY + curveOffset;
                
                return (
                  <g key={`path-${slide.id}-${nextSlide.id}`}>
                    {/* Curved path */}
                    <path
                      d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`}
                      fill="none"
                      stroke={isCurrentPath && showPathPreview ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.3)"}
                      strokeWidth={isCurrentPath && showPathPreview ? "3" : "2"}
                      strokeDasharray={showPathPreview && isCurrentPath ? "none" : "5,5"}
                      className="transition-all duration-500"
                    />
                    {/* Arrow head */}
                    {showPathPreview && isCurrentPath && (
                      <polygon
                        points={`${x2-10},${y2-5} ${x2},${y2} ${x2-10},${y2+5}`}
                        fill="rgba(59, 130, 246, 0.8)"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Slides */}
          {presentation.slides.map((slide, index) => {
            const isCurrent = slide.id === presentation.currentSlideId;
            const slideNumber = sortedSlides.findIndex(s => s.id === slide.id) + 1;
            
            return (
              <div
                key={slide.id}
                className={`absolute transition-all rounded-3xl overflow-hidden cursor-pointer ${
                  isCurrent
                    ? "ring-4 ring-blue-400/70 shadow-[0_0_80px_rgba(59,130,246,0.6)] z-10 scale-100"
                    : showOverview
                    ? "opacity-80 scale-100 hover:opacity-100 hover:scale-105 hover:ring-2 hover:ring-blue-400/40 z-0"
                    : "opacity-30 scale-95 hover:opacity-50 hover:scale-100 z-0"
                }`}
                style={{
                  left: `${slide.x}px`,
                  top: `${slide.y}px`,
                  width: `${slide.width}px`,
                  height: `${slide.height}px`,
                  backgroundColor: slide.backgroundColor || "#0a0a0a",
                  color: slide.textColor || "#ffffff",
                  transitionProperty: 'all',
                  transitionDuration: `${transitionSpeed}ms`,
                  transitionTimingFunction: transitionEasing,
                  transform: enable3D && isCurrent ? 'translateZ(10px)' : 'none',
                }}
                onClick={() => !isCurrent && goToSlide(slide.id)}
              >
                {/* Slide Number Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
                    <span className="text-xs font-bold text-blue-400 tabular-nums">{slideNumber}</span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 h-full flex flex-col justify-center bg-gradient-to-br from-gray-900/98 via-gray-800/95 to-black/98 backdrop-blur-sm relative overflow-hidden">
                  {/* Subtle gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <h2 
                      className="font-bold mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-white leading-tight drop-shadow-2xl tracking-tight"
                      style={{
                        fontSize: `calc(${presentationMode || isFullscreen ? '2.5rem' : '1.5rem'} * ${fontSize})`,
                      }}
                    >
                      {slide.title}
                    </h2>
                    {slide.content && (
                      <div className="flex-1 overflow-y-auto">
                        <div 
                          className="text-gray-100 leading-relaxed prose prose-invert prose-lg max-w-none"
                          style={{
                            fontSize: `calc(${presentationMode || isFullscreen ? '1.5rem' : '1rem'} * ${fontSize})`,
                          }}
                          dangerouslySetInnerHTML={{ __html: slide.content || "" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Elegant Navigation Controls */}
        <div
          className={`${
            presentationMode || isFullscreen 
              ? "fixed bottom-8 left-1/2 -translate-x-1/2" 
              : "absolute bottom-8 left-1/2 -translate-x-1/2"
          } z-50 transition-all duration-500 ease-out ${
            showControls || !presentationMode || !isFullscreen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-2 bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-2xl rounded-2xl px-6 py-3.5 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousSlide}
              disabled={currentSlideIndex <= 0 || isTransitioning}
              className="h-12 w-12 rounded-xl bg-white/5 hover:bg-blue-500/40 text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
              title="Previous (← or ↑)"
            >
              <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
            
            <div className="flex items-center gap-5 px-5">
              <div className="text-center min-w-[100px]">
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                    {currentSlideIndex + 1}
                  </span>
                  <span className="text-sm text-gray-400 font-medium">/</span>
                  <span className="text-lg text-gray-500 tabular-nums">
                    {presentation.slides.length}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-medium">Slide</div>
              </div>
              
              {presentationMode && (
                <>
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStopPresentation}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/40 hover:to-red-600/40 text-white text-sm font-semibold transition-all duration-300 hover:scale-105 border border-red-500/20 hover:border-red-500/40 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
                  >
                    Stop
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextSlide}
              disabled={currentSlideIndex >= presentation.slides.length - 1 || isTransitioning}
              className="h-12 w-12 rounded-xl bg-white/5 hover:bg-blue-500/40 text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
              title="Next (→ or ↓ or Space)"
            >
              <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Zoom & Font Controls - Right Side */}
        <div
          className={`${
            presentationMode || isFullscreen 
              ? "fixed right-6 bottom-24" 
              : "absolute right-6 bottom-24"
          } z-50 transition-all duration-300 ${
            showControls || !presentationMode || !isFullscreen
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-4 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-3">
            {/* Font Size Controls */}
            <div className="flex flex-col gap-2 bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-xl rounded-2xl p-2.5 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFontSize((prev) => Math.min(2, prev + 0.1));
                }}
                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-blue-500/30 text-white border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
                title="Increase Font Size (Shift +)"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Button>
              <div className="px-2 py-2 text-center">
                <Type className="w-4 h-4 mx-auto mb-1.5 text-gray-400" />
                <span className="text-xs font-mono font-semibold text-white tabular-nums">{Math.round(fontSize * 100)}%</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFontSize((prev) => Math.max(0.5, prev - 0.1));
                }}
                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-blue-500/30 text-white border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
                title="Decrease Font Size (Shift -)"
              >
                <Minus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex flex-col gap-2 bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-xl rounded-2xl p-2.5 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setZoom((prev) => Math.min(4, prev + 0.3));
                }}
                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-blue-500/30 text-white border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Button>
              <div className="px-2 py-2 text-center">
                <span className="text-xs font-mono font-semibold text-white tabular-nums">{Math.round(zoom * 100)}%</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setZoom((prev) => Math.max(0.3, prev - 0.3));
                }}
                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-blue-500/30 text-white border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Button>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1.5"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentSlide) {
                    centerOnSlide(currentSlide);
                  }
                }}
                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-blue-500/30 text-white border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
                title="Fit to Screen (0)"
              >
                <Maximize className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-blue-500/30 text-white border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
                title="Fullscreen (F)"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                ) : (
                  <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Slide Progress Bar - Top */}
        {(presentationMode || isFullscreen) && (
          <div
            className={`${
              presentationMode || isFullscreen 
                ? "fixed top-0 left-0 right-0" 
                : "absolute top-0 left-0 right-0"
            } h-1 bg-white/10 z-40 transition-opacity duration-300 ${
              showControls || !presentationMode || !isFullscreen ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
              style={{ width: `${((currentSlideIndex + 1) / presentation.slides.length) * 100}%` }}
            />
          </div>
        )}

        {/* Slide Counter - Top Right (Presentation Mode) */}
        {(presentationMode || isFullscreen) && (
          <div
            className={`${
              presentationMode || isFullscreen 
                ? "fixed top-6 right-6" 
                : "absolute top-6 right-6"
            } z-40 transition-opacity duration-300 ${
              showControls || !presentationMode || !isFullscreen ? "opacity-100" : "opacity-0"
            } flex flex-col gap-2 items-end`}
          >
            <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
              <span className="text-sm font-mono text-gray-300">
                {currentSlideIndex + 1} / {presentation.slides.length}
              </span>
            </div>
            
          </div>
        )}

        {/* Draggable Timer Widget with Circular Progress - Only visible to presenter */}
        {isPresenter && timerEnabled && (timeRemaining > 0 || timerRunning) && (
          <div
            ref={timerRef}
            className={`${
              presentationMode || isFullscreen 
                ? "fixed" 
                : "absolute"
            } z-50`}
            style={{
              left: `${timerPosition.x}px`,
              top: `${timerPosition.y}px`,
            }}
          >
            <div
              onMouseDown={handleTimerMouseDown}
              className={`bg-black/90 backdrop-blur-xl rounded-full p-4 border-2 shadow-2xl transition-all duration-200 cursor-move select-none ${
                isDraggingTimer
                  ? 'border-blue-400/70 shadow-blue-400/20'
                  : isCriticalZone
                  ? 'border-red-500/70 shadow-red-500/50'
                  : isWarningZone
                  ? 'border-yellow-500/70 shadow-yellow-500/50'
                  : 'border-white/20 hover:border-blue-400/50'
              }`}
              style={{
                animation: isCriticalZone 
                  ? 'criticalGlow 1s ease-in-out infinite' 
                  : isWarningZone 
                  ? 'warningGlow 1.5s ease-in-out infinite' 
                  : 'none',
              }}
            >
              {/* Circular Progress Bar */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="absolute inset-0 transform -rotate-90" width="96" height="96">
                  {/* Background circle */}
                  <circle
                    cx="48"
                    cy="48"
                    r={CIRCLE_RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="48"
                    cy="48"
                    r={CIRCLE_RADIUS}
                    fill="none"
                    stroke={isCriticalZone 
                      ? "rgba(239,68,68,0.8)" 
                      : isWarningZone 
                      ? "rgba(234,179,8,0.7)" 
                      : "rgba(59,130,246,0.7)"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={CIRCLE_CIRCUMFERENCE}
                    strokeDashoffset={progressOffset}
                    className="transition-all duration-300"
                    style={{
                      filter: isCriticalZone 
                        ? 'drop-shadow(0 0 8px rgba(239,68,68,0.6))' 
                        : isWarningZone 
                        ? 'drop-shadow(0 0 6px rgba(234,179,8,0.5))' 
                        : 'drop-shadow(0 0 4px rgba(59,130,246,0.4))'
                    }}
                  />
                </svg>
                
                {/* Timer content */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`text-xl font-mono font-bold transition-colors duration-300 leading-tight ${
                    isCriticalZone
                      ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      : isWarningZone
                      ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                      : "text-blue-400"
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                  {timerRunning && (
                    <div className="text-[8px] text-green-400 font-semibold mt-0.5 animate-pulse">
                      ●
                    </div>
                  )}
                </div>
              </div>
              
              {/* Warning indicator */}
              {(isWarningZone || isCriticalZone) && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${
                  isCriticalZone ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
              )}
            </div>
          </div>
        )}

        {/* Presentation Title - Top Left (Presentation Mode) */}
        {(presentationMode || isFullscreen) && (
          <div
            className={`${
              presentationMode || isFullscreen 
                ? "fixed top-6 left-6" 
                : "absolute top-6 left-6"
            } z-40 transition-opacity duration-300 ${
              showControls || !presentationMode || !isFullscreen ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
              <span className="text-sm text-gray-300 truncate max-w-[200px]">
                {presentation.title}
              </span>
            </div>
          </div>
        )}

        {/* Prezi Mini-Map Navigator */}
        {showMiniMap && presentation && (
          <div
            className={`${
              presentationMode || isFullscreen 
                ? "fixed bottom-6 left-6" 
                : "absolute bottom-6 left-6"
            } z-50 bg-black/80 backdrop-blur-xl rounded-lg p-3 border border-white/20 shadow-2xl`}
            style={{ width: '200px', height: '150px' }}
          >
            <div className="text-xs text-gray-400 mb-2 font-semibold flex items-center gap-1">
              <Map className="w-3 h-3" />
              Navigator
            </div>
            <div className="relative w-full h-full bg-gray-900/50 rounded border border-white/10 overflow-hidden">
              {/* Mini-map viewport indicator */}
              <div
                className="absolute border-2 border-blue-400 bg-blue-400/10 pointer-events-none z-10"
                style={{
                  left: `${Math.max(0, Math.min(100, ((panX / zoom + CANVAS_SIZE / 2) / CANVAS_SIZE) * 100))}%`,
                  top: `${Math.max(0, Math.min(100, ((panY / zoom + CANVAS_SIZE / 2) / CANVAS_SIZE) * 100))}%`,
                  width: `${Math.min(100, (100 / zoom))}%`,
                  height: `${Math.min(100, (100 / zoom))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
              {/* Mini-map slides */}
              {presentation.slides.map((slide) => {
                const isCurrent = slide.id === presentation.currentSlideId;
                return (
                  <div
                    key={slide.id}
                    className={`absolute border ${
                      isCurrent ? 'border-blue-400 bg-blue-400/30' : 'border-white/20 bg-white/10'
                    }`}
                    style={{
                      left: `${(slide.x / CANVAS_SIZE) * 100}%`,
                      top: `${(slide.y / CANVAS_SIZE) * 100}%`,
                      width: `${(slide.width / CANVAS_SIZE) * 100}%`,
                      height: `${(slide.height / CANVAS_SIZE) * 100}%`,
                    }}
                    onClick={() => goToSlide(slide.id)}
                    title={slide.title}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slide Thumbnails - Only show when not in presentation mode */}
      {!presentationMode && !isFullscreen && (
        <div className="flex-shrink-0 z-40 bg-black/90 backdrop-blur-md border-t border-white/10">
          <div className="container mx-auto px-4 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {sortedSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(slide.id)}
                  className={`min-w-[120px] p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 flex-shrink-0 text-left ${
                    slide.id === presentation.currentSlideId
                      ? "border-blue-500 bg-blue-500/20 shadow-lg"
                      : "border-white/20 hover:border-white/40 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-400">#{index + 1}</span>
                    {slide.id === presentation.currentSlideId && (
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold truncate text-white mb-0.5">
                    {slide.title}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate line-clamp-1">
                    {slide.content || "No content"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
