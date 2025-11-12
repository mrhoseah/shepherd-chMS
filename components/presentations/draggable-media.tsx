"use client";

import { useState, useRef, useEffect } from "react";
import { X, Move, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraggableMediaProps {
  id: string;
  src: string;
  type: "image" | "video";
  x: number;
  y: number;
  width: number;
  height: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
  onRemove: (id: string) => void;
  containerWidth: number;
  containerHeight: number;
}

export function DraggableMedia({
  id,
  src,
  type,
  x,
  y,
  width,
  height,
  onPositionChange,
  onSizeChange,
  onRemove,
  containerWidth,
  containerHeight,
}: DraggableMediaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const mediaRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    if ((e.target as HTMLElement).closest('.remove-button')) return;
    
    setIsDragging(true);
    const rect = mediaRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - x,
        y: e.clientY - rect.top - y,
      });
    }
    e.preventDefault();
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width,
      height,
    });
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(containerWidth - width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(containerHeight - height, e.clientY - dragStart.y));
        onPositionChange(id, newX, newY);
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const aspectRatio = resizeStart.width / resizeStart.height;
        
        let newWidth = resizeStart.width + deltaX;
        let newHeight = resizeStart.height + deltaY;
        
        // Maintain aspect ratio
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
        
        // Constrain to container
        newWidth = Math.max(50, Math.min(containerWidth - x, newWidth));
        newHeight = Math.max(50, Math.min(containerHeight - y, newHeight));
        
        onSizeChange(id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, id, width, height, x, y, containerWidth, containerHeight, onPositionChange, onSizeChange]);

  return (
    <div
      ref={mediaRef}
      className="absolute group cursor-move"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative w-full h-full border-2 border-blue-500/50 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        {type === "image" ? (
          <img
            src={src}
            alt="Media"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <video
            src={src}
            className="w-full h-full object-cover pointer-events-none"
            controls={false}
          />
        )}
        
        {/* Controls overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 remove-button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Resize handle */}
        <div
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize resize-handle opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white"
          onMouseDown={(e) => handleResizeMouseDown(e, "se")}
        >
          <Maximize2 className="w-2 h-2 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45" />
        </div>
      </div>
    </div>
  );
}

