"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { FurnitureType } from "@/lib/generated/prisma/enums";
import { furnitureConfigs } from "@/lib/seating-config";
import { RotateCw, X } from "lucide-react";

export interface LayoutItem {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  rotation: number;
  capacity: number;
  label?: string;
  color?: string;
  width: number;
  height: number;
}

interface DraggableFurnitureProps {
  item: LayoutItem;
  onStop: (id: string, x: number, y: number) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onCapacityChange: (id: string, capacity: number) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function DraggableFurniture({
  item,
  onStop,
  onRotate,
  onDelete,
  onCapacityChange,
  canvasWidth,
  canvasHeight,
}: DraggableFurnitureProps) {
  const config = furnitureConfigs[item.type];
  const { color: defaultColor, icon: Icon } = config;
  const color = item.color || defaultColor;
  
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [currentCapacity, setCurrentCapacity] = useState(item.capacity);

  useEffect(() => {
    setCurrentCapacity(item.capacity);
  }, [item.capacity]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't drag if clicking controls
    const target = e.target as HTMLElement;
    if (target.closest('[data-control="true"]')) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    }
  };

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const canvas = document.getElementById("canvas-container");
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();

      let newX = clientX - canvasRect.left - offset.x;
      let newY = clientY - canvasRect.top - offset.y;

      // Boundary checking
      newX = Math.max(0, Math.min(newX, canvasWidth - item.width));
      newY = Math.max(0, Math.min(newY, canvasHeight - item.height));

      onStop(item.id, newX, newY);
    },
    [isDragging, offset, onStop, item.id, item.width, item.height, canvasWidth, canvasHeight]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("touchend", handleEnd);
    } else {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    const newCapacity = isNaN(value) || value < 0 ? 0 : value;
    setCurrentCapacity(newCapacity);
    onCapacityChange(item.id, newCapacity);
  };

  const isSeating = config.defaultCapacity > 0;

  return (
    <div
      ref={itemRef}
      className="absolute border border-gray-300 shadow-sm group hover:border-indigo-600/70 transition-all duration-100 ease-in-out cursor-move bg-white/90 rounded-sm"
      style={{
        width: `${item.width}px`,
        height: `${item.height}px`,
        transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`,
        zIndex: isDragging ? 20 : 10,
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <div className="w-full h-full flex items-center justify-center p-1 relative">
        {/* SVG Icon */}
        <Icon className="w-full h-full p-1" style={{ color }} />

        {/* Capacity Display and Input */}
        {isSeating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Static Display */}
            <div className="text-xs font-bold text-gray-700 pointer-events-none group-hover:opacity-0 transition-opacity">
              {item.capacity}
            </div>

            {/* Editable Input (on hover) */}
            <input
              data-control="true"
              type="number"
              min="0"
              value={currentCapacity}
              onChange={handleCapacityChange}
              className="absolute w-1/2 h-1/2 text-center text-sm font-semibold bg-indigo-50 border border-indigo-400 rounded p-0 m-0 focus:outline-none focus:ring-1 focus:ring-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
              style={{ maxWidth: "50px", maxHeight: "20px" }}
              onBlur={() => onCapacityChange(item.id, currentCapacity)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Rotate Button */}
        <button
          data-control="true"
          className="absolute top-0 right-0 p-1 text-white bg-indigo-700/80 rounded-bl-sm opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-indigo-700"
          onClick={(e) => {
            e.stopPropagation();
            onRotate(item.id);
          }}
          title="Rotate 90 degrees"
        >
          <RotateCw className="w-3 h-3" />
        </button>

        {/* Delete Button */}
        <button
          data-control="true"
          className="absolute top-0 left-0 p-1 text-white bg-red-700/80 rounded-br-sm opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          title="Delete item"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Optional Label */}
        {item.label && (
          <span className="absolute bottom-0 left-0 text-[10px] text-gray-700 bg-white/90 px-1 rounded-tr-sm">
            {item.label}
          </span>
        )}

        {/* ID Label (on hover) */}
        <span className="absolute bottom-0 right-0 text-[8px] text-gray-700 bg-white/70 px-1 rounded-tl-sm opacity-0 group-hover:opacity-100">
          {item.id.substring(0, 4)}
        </span>
      </div>
    </div>
  );
}
