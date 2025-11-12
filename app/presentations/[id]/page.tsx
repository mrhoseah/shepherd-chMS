"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Maximize2,
  Eye,
  Minimize2,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize,
  Type,
  Minus,
  Plus,
  Presentation,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

interface Presentation {
  id: string;
  title: string;
  description: string | null;
  currentSlideId: string | null;
  presenterUserId: string | null;
  isPublic: boolean;
  slides: Slide[];
  showSlideRing?: boolean; // Optional: controlled by presenter
  viewerSize?: "responsive" | "1920x1080"; // Viewer display size mode
  isPresenting?: boolean; // Whether presenter is currently presenting
  viewerCountdown?: number; // Countdown timer for viewers (seconds)
}

const CANVAS_SIZE = 1000;
const VIEWPORT_SIZE = 600;

function PublicPresentationViewPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const presentationId = params.id as string;
  const { toast } = useToast();

  // Check if streaming mode is enabled via URL parameter
  const isStreamingMode = searchParams?.get('streaming') === 'true' || searchParams?.get('obs') === 'true';

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showControls, setShowControls] = useState(!isStreamingMode);
  const [fontSize, setFontSize] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSlideRing, setShowSlideRing] = useState(true); // Default to true, controlled by presenter
  const [viewerSize, setViewerSize] = useState<"responsive" | "1920x1080">("responsive"); // Viewer size mode
  const [backgroundType, setBackgroundType] = useState<"interactive" | "plain" | "dots" | "hexagon" | "radial" | "paper" | "stars" | "circuit">("interactive");
  const [isPresenting, setIsPresenting] = useState(false); // Whether presenter is presenting
  const [viewerCountdown, setViewerCountdown] = useState(0); // Countdown timer for viewers
  const [countdownTime, setCountdownTime] = useState(0); // Current countdown time
  const [viewerAnimation, setViewerAnimation] = useState<"countdown" | "pulse" | "wave" | "spinner" | "particles" | "gradient">("pulse");
  const canvasRef = useRef<HTMLDivElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    fetchPresentation();
    
    // Set up real-time sync (polling every 1 second for viewers)
    const interval = setInterval(() => {
      fetchPresentation();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [presentationId]);

  // Countdown timer effect for viewers
  useEffect(() => {
    // Only run countdown if presenter is not presenting and countdown is active
    if (!isPresenting && countdownTime > 0) {
      const interval = setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (isPresenting && countdownTime > 0) {
      // Reset countdown when presenter starts
      setCountdownTime(0);
    }
  }, [isPresenting, countdownTime]);

  // Auto-enter streaming mode when URL parameter is present
  useEffect(() => {
    if (isStreamingMode) {
      setPresentationMode(true);
      setShowControls(false);
      // Auto-enter fullscreen for streaming
      const timer = setTimeout(async () => {
        try {
          const element = canvasRef.current || document.documentElement;
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          }
        } catch (error) {
          console.error("Error entering fullscreen:", error);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isStreamingMode]);

  // Auto-hide controls for viewers - always autohide but show on hover (unless streaming)
  useEffect(() => {
    if (isStreamingMode) {
      setShowControls(false);
      return;
    }

    const handleMouseMove = () => {
      setShowControls(true);
      
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      
      mouseTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, [isStreamingMode]);

  const fetchPresentation = async () => {
    try {
      const res = await fetch(`/api/presentations/${presentationId}`);
      if (res.ok) {
        const data = await res.json();
        setPresentation(data.presentation);
        
        // Update showSlideRing from presentation data (if set by presenter)
        if (data.presentation.showSlideRing !== undefined) {
          setShowSlideRing(data.presentation.showSlideRing);
        }
        
        // Update viewerSize from presentation data (if set by presenter)
        if (data.presentation.viewerSize !== undefined) {
          setViewerSize(data.presentation.viewerSize);
        }
        
        // Update backgroundType from presentation data (if set by presenter)
        if (data.presentation.backgroundType !== undefined) {
          setBackgroundType(data.presentation.backgroundType as typeof backgroundType);
        }
        
        // Update isPresenting status
        if (data.presentation.isPresenting !== undefined) {
          setIsPresenting(data.presentation.isPresenting);
        }
        
        // Update viewerCountdown and initialize countdown timer
        if (data.presentation.viewerCountdown !== undefined) {
          const newCountdown = data.presentation.viewerCountdown;
          const wasCountdown = viewerCountdown;
          setViewerCountdown(newCountdown);
          // Initialize countdown timer if:
          // 1. Countdown is set and > 0
          // 2. Presenter is not presenting
          // 3. Countdown hasn't been initialized yet or is a new value
          if (newCountdown > 0 && !data.presentation.isPresenting) {
            // Always reset and start countdown if it's a new value or if countdown reached 0
            if (countdownTime === 0 || newCountdown !== wasCountdown) {
              setCountdownTime(newCountdown);
            }
          } else if (newCountdown === 0 || data.presentation.isPresenting) {
            // Reset countdown if set to 0 or presenter started
            setCountdownTime(0);
          }
        }
        
        // Update viewerAnimation - always update if present to allow template changes
        if (data.presentation.viewerAnimation !== undefined && data.presentation.viewerAnimation !== null) {
          const newAnimation = data.presentation.viewerAnimation as typeof viewerAnimation;
          if (newAnimation !== viewerAnimation) {
            setViewerAnimation(newAnimation);
          }
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
      } else if (res.status === 401 || res.status === 404) {
        toast({
          title: "Access Denied",
          description: "This presentation is not publicly available or doesn't exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching presentation:", error);
    } finally {
      setLoading(false);
    }
  };

  const centerOnSlide = (slide: Slide, immediate = false) => {
    const viewportWidth = canvasRef.current?.clientWidth || VIEWPORT_SIZE;
    const viewportHeight = canvasRef.current?.clientHeight || VIEWPORT_SIZE;
    
    // Reduce padding for 1920x1080 mode to maximize space for small text
    let padding: number;
    if (viewerSize === "1920x1080") {
      padding = 10; // Minimal padding for fixed 1920x1080 mode
    } else if (presentationMode || isFullscreen) {
      padding = 40;
    } else {
      padding = 60;
    }
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - padding * 2;
    
    const zoomX = availableWidth / slide.width;
    const zoomY = availableHeight / slide.height;
    const fitZoom = Math.min(Math.min(zoomX, zoomY), 4);
    
    const slideCenterX = slide.x + slide.width / 2;
    const slideCenterY = slide.y + slide.height / 2;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    const panXValue = viewportCenterX - (slideCenterX * fitZoom);
    const panYValue = viewportCenterY - (slideCenterY * fitZoom);
    
    setPanX(panXValue);
    setPanY(panYValue);
    setZoom(fitZoom);
  };


  const currentSlide = presentation?.slides.find(
    (s) => s.id === presentation.currentSlideId
  );
  const currentSlideIndex = presentation?.slides.findIndex(
    (s) => s.id === presentation.currentSlideId
  ) ?? -1;

  const sortedSlides = presentation?.slides.sort((a, b) => a.order - b.order) || [];

  // Viewers can't change slides, only the presenter can
  const goToSlide = useCallback(async (slideId: string) => {
    // Viewers are read-only, they just follow the presenter
    // This function is kept for consistency but won't update the server
    if (currentSlide) {
      centerOnSlide(currentSlide);
    }
  }, [currentSlide]);

  // Keyboard navigation for viewers (read-only)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          toggleFullscreen();
        } else if (presentationMode) {
          setPresentationMode(false);
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
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentSlide, isFullscreen, presentationMode]);

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
    // Viewers can't navigate, only presenter controls
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
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

  useEffect(() => {
    if (presentationMode && !isFullscreen) {
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
    return () => {};
  }, [presentationMode, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
      
      if (!isFull && presentationMode) {
        setPresentationMode(false);
      }
      
      if (currentSlide) {
        setTimeout(() => centerOnSlide(currentSlide), 100);
      }
    };

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

  return (
    <div 
      className={`${
        isStreamingMode 
          ? "bg-black" 
          : "bg-gradient-to-br from-gray-950 via-black to-gray-900"
      } text-white ${
        presentationMode || isFullscreen || isStreamingMode
          ? "fixed inset-0 w-screen h-screen overflow-hidden z-[9999]" 
          : "w-full h-screen overflow-hidden flex flex-col"
      }`}
      style={
        presentationMode || isFullscreen || isStreamingMode
          ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 } 
          : { height: '100vh', maxHeight: '100vh' }
      }
    >
      {/* Header - Only show when not in presentation mode or streaming */}
      {!presentationMode && !isFullscreen && !isStreamingMode && (
        <div className="flex-shrink-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white tracking-tight truncate">{presentation.title}</h1>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresentationMode(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 border-0 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/30 transition-all duration-300"
                >
                  <Play className="w-4 h-4 mr-2" />
                  View
                </Button>
                
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

      {/* Main Canvas Area */}
      <div
        className={`relative flex-1 min-h-0 ${
          presentationMode || isFullscreen || isStreamingMode
            ? "w-full h-full" 
            : viewerSize === "1920x1080"
            ? "w-full h-full flex items-center justify-center"
            : "w-full h-full"
        }`}
        ref={canvasRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={
          presentationMode || isFullscreen || isStreamingMode
            ? { width: '100vw', height: '100vh' }
            : viewerSize === "1920x1080"
            ? {
                width: '100%',
                height: '100%',
                maxWidth: '1920px',
                maxHeight: '1080px',
                aspectRatio: '16/9'
              }
            : { width: '100%', height: '100%' }
        }
      >
        <div
          className="absolute inset-0 transition-all duration-[1500ms] ease-in-out"
          style={{
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Waiting Placeholder - Show when presenter is not presenting */}
          {!isPresenting && !isStreamingMode && presentation && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/95 backdrop-blur-xl">
              <div className="text-center space-y-8 px-6 max-w-2xl">
                {/* Animation Templates */}
                {viewerAnimation === "pulse" && (
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse"></div>
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Presentation className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>
                )}

                {viewerAnimation === "countdown" && (
                  <>
                    {countdownTime > 0 ? (
                      <div className="space-y-4">
                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-blue-500/50 bg-blue-500/10 animate-pulse">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-blue-400 tabular-nums">
                              {countdownTime}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">seconds</div>
                          </div>
                        </div>
                        <p className="text-gray-400">Presentation starting soon...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <p className="text-xl text-gray-300">Waiting for presenter to start...</p>
                      </div>
                    )}
                  </>
                )}

                {viewerAnimation === "wave" && (
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping"></div>
                    <div className="absolute inset-4 rounded-full border-4 border-blue-500/40 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute inset-8 rounded-full border-4 border-blue-500/50 animate-ping" style={{ animationDelay: '1s' }}></div>
                    <div className="relative z-10">
                      <Presentation className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>
                )}

                {viewerAnimation === "spinner" && (
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="relative z-10">
                      <Presentation className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>
                )}

                {viewerAnimation === "particles" && (
                  <div className="relative w-32 h-32 mx-auto">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                        style={{
                          left: `${50 + 40 * Math.cos((i * 2 * Math.PI) / 12)}%`,
                          top: `${50 + 40 * Math.sin((i * 2 * Math.PI) / 12)}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Presentation className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>
                )}

                {viewerAnimation === "gradient" && (
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-20 animate-pulse"></div>
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute inset-8 rounded-full bg-gradient-to-br from-pink-500 via-blue-500 to-purple-500 opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Presentation className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>
                )}
                
                {/* Title */}
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold text-white">{presentation.title}</h2>
                  {presentation.description && (
                    <p className="text-lg text-gray-400">{presentation.description}</p>
                  )}
                </div>
                
                {/* Countdown Timer (if viewerAnimation is not "countdown" or if countdownTime > 0) */}
                {(viewerAnimation !== "countdown" && countdownTime > 0) && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-blue-500/50 bg-blue-500/10">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-blue-400 tabular-nums">
                          {countdownTime}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">seconds</div>
                      </div>
                    </div>
                    <p className="text-gray-400">Presentation starting soon...</p>
                  </div>
                )}
                
                {/* Waiting Message (if no countdown and animation is not countdown) */}
                {countdownTime === 0 && viewerAnimation !== "countdown" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <p className="text-xl text-gray-300">Waiting for presenter to start...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Canvas Backgrounds - Multiple Prezi-style options */}
          {!isStreamingMode && isPresenting && (
            <>
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
                      <pattern id="hexagon-viewer" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                        <polygon points="30,0 60,13 60,39 30,52 0,39 0,13" fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hexagon-viewer)" />
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
                      <pattern id="stars-viewer" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="1" fill="rgba(59,130,246,0.4)"/>
                        <circle cx="50" cy="30" r="0.5" fill="rgba(147,51,234,0.4)"/>
                        <circle cx="80" cy="15" r="1.5" fill="rgba(59,130,246,0.3)"/>
                        <circle cx="30" cy="70" r="0.8" fill="rgba(236,72,153,0.4)"/>
                        <circle cx="70" cy="80" r="1" fill="rgba(59,130,246,0.4)"/>
                        <circle cx="90" cy="60" r="0.6" fill="rgba(147,51,234,0.3)"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#stars-viewer)" />
                  </svg>
                </div>
              )}
              
              {backgroundType === "circuit" && (
                <div className="absolute inset-0 opacity-[0.03]">
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                      <pattern id="circuit-viewer" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="80" height="80" fill="none"/>
                        <path d="M 0,40 L 80,40 M 40,0 L 40,80" stroke="rgba(59,130,246,0.2)" strokeWidth="1"/>
                        <circle cx="40" cy="40" r="3" fill="rgba(59,130,246,0.3)"/>
                        <circle cx="0" cy="40" r="2" fill="rgba(59,130,246,0.2)"/>
                        <circle cx="80" cy="40" r="2" fill="rgba(59,130,246,0.2)"/>
                        <circle cx="40" cy="0" r="2" fill="rgba(59,130,246,0.2)"/>
                        <circle cx="40" cy="80" r="2" fill="rgba(59,130,246,0.2)"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#circuit-viewer)" />
                  </svg>
                </div>
              )}
              
              {backgroundType === "plain" && (
                <div className="absolute inset-0 bg-black"></div>
              )}
            </>
          )}

          {/* Slides - Only show when presenter is presenting */}
          {isPresenting && presentation.slides.map((slide, index) => {
            const isCurrent = slide.id === presentation.currentSlideId;
            
            return (
              <div
                key={slide.id}
                className={`absolute transition-all duration-[1500ms] ease-in-out rounded-3xl overflow-hidden ${
                  isCurrent
                    ? `${showSlideRing ? "ring-4 ring-blue-400/80 shadow-[0_0_100px_rgba(59,130,246,0.7),0_0_200px_rgba(59,130,246,0.3)]" : ""} z-10 scale-100`
                    : "opacity-0 pointer-events-none z-0"
                }`}
                style={{
                  left: `${slide.x}px`,
                  top: `${slide.y}px`,
                  width: `${slide.width}px`,
                  height: `${slide.height}px`,
                  backgroundColor: slide.backgroundColor || "#0a0a0a",
                  color: slide.textColor || "#ffffff",
                  transitionProperty: 'all',
                }}
              >
                <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 h-full flex flex-col justify-center bg-gradient-to-br from-gray-900/98 via-gray-800/95 to-black/98 backdrop-blur-sm relative overflow-hidden">
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

        {/* Zoom & Font Controls - Hidden in streaming mode */}
        {!isStreamingMode && (
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
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => {
            if (mouseTimeoutRef.current) {
              clearTimeout(mouseTimeoutRef.current);
            }
            mouseTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 3000);
          }}
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
        )}

        {/* Progress Bar - Hidden in streaming mode */}
        {(presentationMode || isFullscreen) && !isStreamingMode && (
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

        {/* Slide Counter - Hidden in streaming mode */}
        {(presentationMode || isFullscreen) && !isStreamingMode && (
          <div
            className={`${
              presentationMode || isFullscreen 
                ? "fixed top-6 right-6" 
                : "absolute top-6 right-6"
            } z-40 transition-opacity duration-300 ${
              showControls || !presentationMode || !isFullscreen ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
              <span className="text-sm font-mono text-gray-300">
                {currentSlideIndex + 1} / {presentation.slides.length}
              </span>
            </div>
          </div>
        )}

        {/* Presentation Title - Hidden in streaming mode */}
        {(presentationMode || isFullscreen) && !isStreamingMode && (
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
      </div>
    </div>
  );
}

export default function PublicPresentationViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
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
    }>
      <PublicPresentationViewPageContent />
    </Suspense>
  );
}
