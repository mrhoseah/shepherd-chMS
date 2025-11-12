"use client";

import { ReactNode } from "react";

interface PreziFrameProps {
  frameType: "rectangle" | "circle" | "bracket" | "invisible";
  width: number;
  height: number;
  rotation?: number;
  backgroundColor?: string;
  borderColor?: string;
  children: ReactNode;
  className?: string;
}

export function PreziFrame({
  frameType,
  width,
  height,
  rotation = 0,
  backgroundColor = "#ffffff",
  borderColor = "#e5e7eb",
  children,
  className = "",
}: PreziFrameProps) {
  const baseStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: "center center",
  };

  switch (frameType) {
    case "circle":
      return (
        <div
          className={`${className}`}
          style={{
            ...baseStyle,
            borderRadius: "50%",
            backgroundColor,
            border: `2px solid ${borderColor}`,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      );

    case "bracket":
      return (
        <div
          className={`relative ${className}`}
          style={baseStyle}
        >
          {/* Bracket frame using SVG */}
          <svg
            width={width}
            height={height}
            className="absolute inset-0 pointer-events-none"
            style={{ overflow: "visible" }}
          >
            <path
              d={`M 10 10 L 10 ${height - 10} M 10 10 L ${width - 10} 10 M ${width - 10} ${height - 10} L ${width - 10} 10 M ${width - 10} ${height - 10} L 10 ${height - 10}`}
              stroke={borderColor}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <div
            className="w-full h-full"
            style={{
              backgroundColor: "transparent",
              padding: "10px",
            }}
          >
            {children}
          </div>
        </div>
      );

    case "invisible":
      return (
        <div
          className={`${className}`}
          style={{
            ...baseStyle,
            backgroundColor: "transparent",
            border: "none",
          }}
        >
          {children}
        </div>
      );

    case "rectangle":
    default:
      return (
        <div
          className={`${className}`}
          style={{
            ...baseStyle,
            backgroundColor,
            border: `2px solid ${borderColor}`,
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      );
  }
}

