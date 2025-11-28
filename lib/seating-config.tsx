import React, { JSX } from "react";
import type { FurnitureType } from "@/lib/generated/prisma/enums";

// SVG Icons for different furniture types
export const PewIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="90" height="20" rx="3" fill="currentColor" opacity="0.8"/>
    <rect x="0" y="2" width="100" height="3" fill="currentColor"/>
  </svg>
);

export const ChairIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor"/>
  </svg>
);

export const ChairGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="10" fill="currentColor" opacity="0.9"/>
    <circle cx="70" cy="30" r="10" fill="currentColor" opacity="0.9"/>
    <circle cx="70" cy="70" r="10" fill="currentColor" opacity="0.9"/>
    <circle cx="30" cy="70" r="10" fill="currentColor" opacity="0.9"/>
    <text x="50" y="55" fontSize="20" textAnchor="middle" fill="currentColor" fontWeight="bold">4+</text>
  </svg>
);

export const RoundTableIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="4.5" fill="currentColor"/>
  </svg>
);

export const HalfCircleTableIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 5 A4 4 0 0 1 9 5 L9 9 L1 9 Z" fill="currentColor"/>
  </svg>
);

export const RectangularTableIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="90" height="40" rx="5" fill="currentColor"/>
  </svg>
);

export const SquareTableIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="8" height="8" rx="1" fill="currentColor"/>
  </svg>
);

export const PulpitIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="40" width="40" height="60" rx="5" fill="currentColor"/>
    <rect x="20" y="30" width="60" height="10" rx="3" fill="currentColor"/>
  </svg>
);

export const PodiumIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 80 L75 80 L70 30 L30 30 Z" fill="currentColor"/>
    <path d="M20 25 L80 25 L80 30 L20 30 Z" fill="currentColor" opacity="0.8"/>
    <rect x="40" y="80" width="20" height="15" rx="2" fill="currentColor"/>
  </svg>
);

export const SoundDeskIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="15" width="80" height="30" rx="5" fill="currentColor"/>
    <circle cx="25" cy="30" r="5" fill="white" opacity="0.7"/>
    <circle cx="50" cy="30" r="5" fill="white" opacity="0.7"/>
    <circle cx="75" cy="30" r="5" fill="white" opacity="0.7"/>
  </svg>
);

export const CameraTripodIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="30" r="10" fill="currentColor"/>
    <line x1="50" y1="40" x2="50" y2="90" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <line x1="50" y1="60" x2="30" y2="95" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <line x1="50" y1="60" x2="70" y2="95" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

export const StageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="10" width="90" height="25" rx="3" fill="currentColor"/>
    <rect x="0" y="35" width="100" height="5" fill="currentColor" opacity="0.6"/>
  </svg>
);

export const AltarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 50 L90 50 L80 20 L20 20 Z" fill="currentColor"/>
    <path d="M45 5 L50 15 L55 5 Z" fill="currentColor"/>
    <rect x="47" y="5" width="6" height="20" fill="currentColor"/>
  </svg>
);

export const BaptismalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="20" width="70" height="40" rx="8" fill="currentColor"/>
    <path d="M20 30 Q50 40, 80 30" stroke="white" strokeWidth="3" fill="none" opacity="0.6"/>
  </svg>
);

// Furniture configuration
export interface FurnitureConfig {
  label: string;
  width: number;
  height: number;
  color: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  defaultCapacity: number;
  description: string;
}

export const furnitureConfigs: Record<FurnitureType, FurnitureConfig> = {
  PEW: {
    label: "Pew (Row)",
    width: 150,
    height: 40,
    color: "#6B46C1",
    icon: PewIcon,
    defaultCapacity: 8,
    description: "Church pew or bench seating",
  },
  CHAIR: {
    label: "Chair (Single)",
    width: 30,
    height: 30,
    color: "#3B82F6",
    icon: ChairIcon,
    defaultCapacity: 1,
    description: "Individual chair",
  },
  CHAIR_GROUP: {
    label: "Chair Group (4+)",
    width: 120,
    height: 120,
    color: "#3B82F6",
    icon: ChairGroupIcon,
    defaultCapacity: 4,
    description: "Group of chairs in circular arrangement",
  },
  ROUND_TABLE: {
    label: "Round Table",
    width: 80,
    height: 80,
    color: "#A0522D",
    icon: RoundTableIcon,
    defaultCapacity: 6,
    description: "Round table with chairs",
  },
  HALF_CIRCLE_TABLE: {
    label: "Half-Circle Table",
    width: 80,
    height: 40,
    color: "#A0522D",
    icon: HalfCircleTableIcon,
    defaultCapacity: 3,
    description: "Crescent or half-circle table",
  },
  RECTANGULAR_TABLE: {
    label: "Rectangular Table",
    width: 150,
    height: 60,
    color: "#8B4513",
    icon: RectangularTableIcon,
    defaultCapacity: 8,
    description: "Long banquet-style table",
  },
  SQUARE_TABLE: {
    label: "Square Table",
    width: 60,
    height: 60,
    color: "#8B4513",
    icon: SquareTableIcon,
    defaultCapacity: 4,
    description: "Square table with chairs",
  },
  PULPIT: {
    label: "Pulpit",
    width: 60,
    height: 60,
    color: "#4B5563",
    icon: PulpitIcon,
    defaultCapacity: 0,
    description: "Pulpit or lectern",
  },
  PODIUM: {
    label: "Podium",
    width: 40,
    height: 60,
    color: "#8B4513",
    icon: PodiumIcon,
    defaultCapacity: 0,
    description: "Standing podium",
  },
  SOUND_DESK: {
    label: "Sound Desk",
    width: 100,
    height: 50,
    color: "#1F2937",
    icon: SoundDeskIcon,
    defaultCapacity: 0,
    description: "Sound or tech control desk",
  },
  CAMERA_TRIPOD: {
    label: "Camera",
    width: 50,
    height: 50,
    color: "#EF4444",
    icon: CameraTripodIcon,
    defaultCapacity: 0,
    description: "Camera position",
  },
  STAGE: {
    label: "Stage",
    width: 200,
    height: 80,
    color: "#6366F1",
    icon: StageIcon,
    defaultCapacity: 0,
    description: "Stage or platform area",
  },
  ALTAR: {
    label: "Altar",
    width: 120,
    height: 80,
    color: "#7C3AED",
    icon: AltarIcon,
    defaultCapacity: 0,
    description: "Altar or communion table",
  },
  BAPTISMAL: {
    label: "Baptismal",
    width: 120,
    height: 80,
    color: "#0EA5E9",
    icon: BaptismalIcon,
    defaultCapacity: 0,
    description: "Baptismal font or pool",
  },
};

// Preset templates
export interface PresetTemplate {
  name: string;
  category: string;
  description: string;
  items: Array<{
    type: FurnitureType;
    x: number;
    y: number;
    rotation: number;
  }>;
}

export const presetTemplates: PresetTemplate[] = [
  {
    name: "Theater Style",
    category: "WORSHIP",
    description: "Traditional rows facing front",
    items: [
      // Front altar and pulpit
      { type: "ALTAR", x: 540, y: 50, rotation: 0 },
      { type: "PULPIT", x: 570, y: 150, rotation: 0 },
      // Rows of pews
      { type: "PEW", x: 150, y: 300, rotation: 0 },
      { type: "PEW", x: 350, y: 300, rotation: 0 },
      { type: "PEW", x: 550, y: 300, rotation: 0 },
      { type: "PEW", x: 750, y: 300, rotation: 0 },
      { type: "PEW", x: 150, y: 360, rotation: 0 },
      { type: "PEW", x: 350, y: 360, rotation: 0 },
      { type: "PEW", x: 550, y: 360, rotation: 0 },
      { type: "PEW", x: 750, y: 360, rotation: 0 },
      { type: "PEW", x: 150, y: 420, rotation: 0 },
      { type: "PEW", x: 350, y: 420, rotation: 0 },
      { type: "PEW", x: 550, y: 420, rotation: 0 },
      { type: "PEW", x: 750, y: 420, rotation: 0 },
      // Back tech area
      { type: "SOUND_DESK", x: 550, y: 800, rotation: 0 },
      { type: "CAMERA_TRIPOD", x: 900, y: 800, rotation: 0 },
    ],
  },
  {
    name: "Circular Seating",
    category: "WORSHIP",
    description: "Chairs arranged in a circle",
    items: [
      // Center altar
      { type: "ALTAR", x: 540, y: 410, rotation: 0 },
      // Circular arrangement of chair groups
      { type: "CHAIR_GROUP", x: 300, y: 300, rotation: 0 },
      { type: "CHAIR_GROUP", x: 700, y: 300, rotation: 0 },
      { type: "CHAIR_GROUP", x: 900, y: 500, rotation: 0 },
      { type: "CHAIR_GROUP", x: 700, y: 700, rotation: 0 },
      { type: "CHAIR_GROUP", x: 300, y: 700, rotation: 0 },
      { type: "CHAIR_GROUP", x: 100, y: 500, rotation: 0 },
    ],
  },
  {
    name: "U-Shape Conference",
    category: "CONFERENCE",
    description: "Tables arranged in U-shape",
    items: [
      // Left side
      { type: "RECTANGULAR_TABLE", x: 100, y: 200, rotation: 90 },
      { type: "RECTANGULAR_TABLE", x: 100, y: 350, rotation: 90 },
      { type: "RECTANGULAR_TABLE", x: 100, y: 500, rotation: 90 },
      // Right side
      { type: "RECTANGULAR_TABLE", x: 950, y: 200, rotation: 90 },
      { type: "RECTANGULAR_TABLE", x: 950, y: 350, rotation: 90 },
      { type: "RECTANGULAR_TABLE", x: 950, y: 500, rotation: 90 },
      // Bottom
      { type: "RECTANGULAR_TABLE", x: 300, y: 650, rotation: 0 },
      { type: "RECTANGULAR_TABLE", x: 550, y: 650, rotation: 0 },
      { type: "RECTANGULAR_TABLE", x: 800, y: 650, rotation: 0 },
      // Presentation area
      { type: "PODIUM", x: 580, y: 100, rotation: 0 },
    ],
  },
  {
    name: "Banquet Style",
    category: "SOCIAL",
    description: "Round tables for dining events",
    items: [
      // Grid of round tables
      { type: "ROUND_TABLE", x: 200, y: 200, rotation: 0 },
      { type: "ROUND_TABLE", x: 400, y: 200, rotation: 0 },
      { type: "ROUND_TABLE", x: 600, y: 200, rotation: 0 },
      { type: "ROUND_TABLE", x: 800, y: 200, rotation: 0 },
      { type: "ROUND_TABLE", x: 200, y: 400, rotation: 0 },
      { type: "ROUND_TABLE", x: 400, y: 400, rotation: 0 },
      { type: "ROUND_TABLE", x: 600, y: 400, rotation: 0 },
      { type: "ROUND_TABLE", x: 800, y: 400, rotation: 0 },
      { type: "ROUND_TABLE", x: 200, y: 600, rotation: 0 },
      { type: "ROUND_TABLE", x: 400, y: 600, rotation: 0 },
      { type: "ROUND_TABLE", x: 600, y: 600, rotation: 0 },
      { type: "ROUND_TABLE", x: 800, y: 600, rotation: 0 },
      // Front stage
      { type: "STAGE", x: 500, y: 50, rotation: 0 },
    ],
  },
  {
    name: "Small Group Circles",
    category: "WORSHIP",
    description: "Multiple small circle groups",
    items: [
      // Front pulpit
      { type: "PULPIT", x: 570, y: 50, rotation: 0 },
      // Small groups
      { type: "CHAIR_GROUP", x: 200, y: 250, rotation: 0 },
      { type: "CHAIR_GROUP", x: 500, y: 250, rotation: 0 },
      { type: "CHAIR_GROUP", x: 800, y: 250, rotation: 0 },
      { type: "CHAIR_GROUP", x: 200, y: 500, rotation: 0 },
      { type: "CHAIR_GROUP", x: 500, y: 500, rotation: 0 },
      { type: "CHAIR_GROUP", x: 800, y: 500, rotation: 0 },
      { type: "CHAIR_GROUP", x: 200, y: 750, rotation: 0 },
      { type: "CHAIR_GROUP", x: 500, y: 750, rotation: 0 },
      { type: "CHAIR_GROUP", x: 800, y: 750, rotation: 0 },
    ],
  },
];
