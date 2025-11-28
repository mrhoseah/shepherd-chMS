import { FurnitureType } from "@/lib/generated/prisma/enums";
import { furnitureConfigs } from "./seating-config";

export interface RoomMeasurements {
  length: number; // in feet
  width: number; // in feet
  shape: "RECTANGLE" | "SQUARE" | "L_SHAPE" | "IRREGULAR";
  obstacles?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: string; // "PILLAR", "WALL", "DOOR", etc.
  }>;
}

export interface SeatingRequirements {
  targetCapacity: number;
  style: "THEATER" | "CIRCULAR" | "U_SHAPE" | "BANQUET" | "CLASSROOM" | "MIXED";
  furniturePreference: "PEWS" | "CHAIRS" | "TABLES" | "MIXED";
  aisleWidth?: number; // in feet, default 4ft
  frontClearance?: number; // in feet, default 10ft for altar/stage
  backClearance?: number; // in feet, default 6ft for tech area
  sideClearance?: number; // in feet, default 3ft
  includeAltar?: boolean;
  includePulpit?: boolean;
  includeSoundDesk?: boolean;
  includeCamera?: boolean;
}

export interface GeneratedLayout {
  items: Array<{
    type: FurnitureType;
    x: number;
    y: number;
    rotation: number;
    capacity: number;
    width: number;
    height: number;
    label?: string;
  }>;
  totalCapacity: number;
  efficiency: number; // percentage of space used
  aisleCount: number;
  warnings: string[];
}

const PIXELS_PER_FOOT = 40; // Scale: 40 pixels = 1 foot
const MIN_AISLE_WIDTH_PX = 160; // 4 feet minimum
const MIN_ROW_SPACING_PX = 120; // 3 feet between rows
const MIN_TABLE_SPACING_PX = 80; // 2 feet between tables

/**
 * AI-powered automatic seating arrangement generator
 */
export async function generateSeatingLayout(
  measurements: RoomMeasurements,
  requirements: SeatingRequirements
): Promise<GeneratedLayout> {
  const canvasWidth = measurements.width * PIXELS_PER_FOOT;
  const canvasHeight = measurements.length * PIXELS_PER_FOOT;
  
  const aisleWidth = (requirements.aisleWidth || 4) * PIXELS_PER_FOOT;
  const frontClearance = (requirements.frontClearance || 10) * PIXELS_PER_FOOT;
  const backClearance = (requirements.backClearance || 6) * PIXELS_PER_FOOT;
  const sideClearance = (requirements.sideClearance || 3) * PIXELS_PER_FOOT;

  const warnings: string[] = [];
  
  // Validate room size
  if (canvasWidth < 400 || canvasHeight < 400) {
    warnings.push("Room is very small. Layout options may be limited.");
  }

  // Generate layout based on style
  let layout: GeneratedLayout;

  switch (requirements.style) {
    case "THEATER":
      layout = generateTheaterLayout(
        canvasWidth,
        canvasHeight,
        requirements,
        frontClearance,
        backClearance,
        sideClearance,
        aisleWidth
      );
      break;
    case "CIRCULAR":
      layout = generateCircularLayout(
        canvasWidth,
        canvasHeight,
        requirements,
        sideClearance
      );
      break;
    case "U_SHAPE":
      layout = generateUShapeLayout(
        canvasWidth,
        canvasHeight,
        requirements,
        sideClearance
      );
      break;
    case "BANQUET":
      layout = generateBanquetLayout(
        canvasWidth,
        canvasHeight,
        requirements,
        sideClearance
      );
      break;
    case "CLASSROOM":
      layout = generateClassroomLayout(
        canvasWidth,
        canvasHeight,
        requirements,
        frontClearance,
        sideClearance,
        aisleWidth
      );
      break;
    case "MIXED":
      layout = generateMixedLayout(
        canvasWidth,
        canvasHeight,
        requirements,
        frontClearance,
        backClearance,
        sideClearance,
        aisleWidth
      );
      break;
    default:
      layout = generateTheaterLayout(
        canvasWidth,
        canvasHeight,
        requirements,
        frontClearance,
        backClearance,
        sideClearance,
        aisleWidth
      );
  }

  // Add front elements (altar, pulpit, stage)
  if (requirements.includeAltar || requirements.includePulpit) {
    const frontItems = generateFrontElements(
      canvasWidth,
      frontClearance,
      requirements
    );
    layout.items.unshift(...frontItems);
  }

  // Add back elements (sound desk, camera)
  if (requirements.includeSoundDesk || requirements.includeCamera) {
    const backItems = generateBackElements(
      canvasWidth,
      canvasHeight,
      backClearance,
      requirements
    );
    layout.items.push(...backItems);
  }

  // Calculate efficiency
  const usedArea = calculateUsedArea(layout.items);
  const totalArea = canvasWidth * canvasHeight;
  layout.efficiency = Math.round((usedArea / totalArea) * 100);

  // Check capacity vs target
  if (layout.totalCapacity < requirements.targetCapacity * 0.8) {
    warnings.push(
      `Generated capacity (${layout.totalCapacity}) is significantly below target (${requirements.targetCapacity}). Consider using pews or smaller furniture.`
    );
  } else if (layout.totalCapacity < requirements.targetCapacity * 0.9) {
    warnings.push(
      `Generated capacity (${layout.totalCapacity}) is slightly below target (${requirements.targetCapacity}).`
    );
  } else if (layout.totalCapacity > requirements.targetCapacity * 1.2) {
    warnings.push(
      `Generated capacity (${layout.totalCapacity}) exceeds target (${requirements.targetCapacity}) significantly. Layout may feel cramped.`
    );
  }

  layout.warnings = warnings;
  return layout;
}

/**
 * Generate theater-style layout (rows facing front)
 */
function generateTheaterLayout(
  canvasWidth: number,
  canvasHeight: number,
  requirements: SeatingRequirements,
  frontClearance: number,
  backClearance: number,
  sideClearance: number,
  aisleWidth: number
): GeneratedLayout {
  const items: any[] = [];
  let totalCapacity = 0;
  let aisleCount = 0;

  const usePews = requirements.furniturePreference === "PEWS" || 
                  requirements.furniturePreference === "MIXED";
  
  const furnitureType = usePews ? "PEW" : "CHAIR";
  const config = furnitureConfigs[furnitureType];
  
  // Calculate available space
  const availableWidth = canvasWidth - (sideClearance * 2);
  const availableHeight = canvasHeight - frontClearance - backClearance;

  // Determine number of sections (with center aisle)
  const hasAisle = availableWidth > 600; // Only add aisle if room is wide enough
  const sections = hasAisle ? 2 : 1;
  aisleCount = hasAisle ? 1 : 0;

  const sectionWidth = hasAisle
    ? (availableWidth - aisleWidth) / 2
    : availableWidth;

  // Calculate items per row based on section width
  const itemsPerRow = Math.floor(sectionWidth / (config.width + 10));
  
  if (itemsPerRow < 1) {
    return { items, totalCapacity: 0, efficiency: 0, aisleCount: 0, warnings: ["Room too narrow for selected furniture"] };
  }

  // Calculate number of rows needed
  const rowHeight = config.height + MIN_ROW_SPACING_PX;
  const maxRows = Math.floor(availableHeight / rowHeight);
  const targetRows = Math.ceil(requirements.targetCapacity / (itemsPerRow * config.defaultCapacity * sections));
  const numRows = Math.min(maxRows, targetRows);

  // Generate rows
  for (let row = 0; row < numRows; row++) {
    const y = frontClearance + (row * rowHeight);

    // Left section
    for (let col = 0; col < itemsPerRow; col++) {
      const x = sideClearance + (col * (config.width + 10));
      items.push({
        type: furnitureType,
        x,
        y,
        rotation: 0,
        capacity: config.defaultCapacity,
        width: config.width,
        height: config.height,
        label: `Row ${row + 1}`,
      });
      totalCapacity += config.defaultCapacity;
    }

    // Right section (if aisle exists)
    if (hasAisle) {
      for (let col = 0; col < itemsPerRow; col++) {
        const x = sideClearance + sectionWidth + aisleWidth + (col * (config.width + 10));
        items.push({
          type: furnitureType,
          x,
          y,
          rotation: 0,
          capacity: config.defaultCapacity,
          width: config.width,
          height: config.height,
          label: `Row ${row + 1}`,
        });
        totalCapacity += config.defaultCapacity;
      }
    }
  }

  return { items, totalCapacity, efficiency: 0, aisleCount, warnings: [] };
}

/**
 * Generate circular seating layout
 */
function generateCircularLayout(
  canvasWidth: number,
  canvasHeight: number,
  requirements: SeatingRequirements,
  sideClearance: number
): GeneratedLayout {
  const items: any[] = [];
  let totalCapacity = 0;

  const config = furnitureConfigs.CHAIR_GROUP;
  
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const maxRadius = Math.min(canvasWidth, canvasHeight) / 2 - sideClearance - config.width;

  // Calculate how many groups we need
  const groupsNeeded = Math.ceil(requirements.targetCapacity / config.defaultCapacity);
  
  // Determine number of concentric circles
  const groupsPerCircle = 6; // 6 groups per circle for balanced look
  const numCircles = Math.ceil(groupsNeeded / groupsPerCircle);
  
  let groupsPlaced = 0;

  for (let circle = 0; circle < numCircles && groupsPlaced < groupsNeeded; circle++) {
    const radius = maxRadius * ((circle + 1) / (numCircles + 0.5));
    const groupsInThisCircle = Math.min(groupsPerCircle, groupsNeeded - groupsPlaced);
    
    for (let i = 0; i < groupsInThisCircle; i++) {
      const angle = (i / groupsInThisCircle) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle) - config.width / 2;
      const y = centerY + radius * Math.sin(angle) - config.height / 2;
      
      items.push({
        type: "CHAIR_GROUP",
        x,
        y,
        rotation: 0,
        capacity: config.defaultCapacity,
        width: config.width,
        height: config.height,
      });
      
      totalCapacity += config.defaultCapacity;
      groupsPlaced++;
    }
  }

  return { items, totalCapacity, efficiency: 0, aisleCount: 0, warnings: [] };
}

/**
 * Generate U-shape conference layout
 */
function generateUShapeLayout(
  canvasWidth: number,
  canvasHeight: number,
  requirements: SeatingRequirements,
  sideClearance: number
): GeneratedLayout {
  const items: any[] = [];
  let totalCapacity = 0;

  const config = furnitureConfigs.RECTANGULAR_TABLE;
  
  const availableWidth = canvasWidth - (sideClearance * 2);
  const availableHeight = canvasHeight - (sideClearance * 2);

  const tableSpacing = 20;

  // Left side (vertical tables)
  const leftTablesCount = Math.floor(availableHeight / (config.width + tableSpacing));
  for (let i = 0; i < leftTablesCount; i++) {
    items.push({
      type: "RECTANGULAR_TABLE",
      x: sideClearance,
      y: sideClearance + (i * (config.width + tableSpacing)),
      rotation: 90,
      capacity: config.defaultCapacity,
      width: config.width,
      height: config.height,
    });
    totalCapacity += config.defaultCapacity;
  }

  // Right side (vertical tables)
  for (let i = 0; i < leftTablesCount; i++) {
    items.push({
      type: "RECTANGULAR_TABLE",
      x: canvasWidth - sideClearance - config.height,
      y: sideClearance + (i * (config.width + tableSpacing)),
      rotation: 90,
      capacity: config.defaultCapacity,
      width: config.width,
      height: config.height,
    });
    totalCapacity += config.defaultCapacity;
  }

  // Bottom (horizontal tables)
  const bottomTablesCount = Math.floor(availableWidth / (config.width + tableSpacing));
  const bottomY = canvasHeight - sideClearance - config.height;
  
  for (let i = 0; i < bottomTablesCount; i++) {
    items.push({
      type: "RECTANGULAR_TABLE",
      x: sideClearance + (i * (config.width + tableSpacing)),
      y: bottomY,
      rotation: 0,
      capacity: config.defaultCapacity,
      width: config.width,
      height: config.height,
    });
    totalCapacity += config.defaultCapacity;
  }

  return { items, totalCapacity, efficiency: 0, aisleCount: 0, warnings: [] };
}

/**
 * Generate banquet-style layout (round tables grid)
 */
function generateBanquetLayout(
  canvasWidth: number,
  canvasHeight: number,
  requirements: SeatingRequirements,
  sideClearance: number
): GeneratedLayout {
  const items: any[] = [];
  let totalCapacity = 0;

  const config = furnitureConfigs.ROUND_TABLE;
  
  const availableWidth = canvasWidth - (sideClearance * 2);
  const availableHeight = canvasHeight - (sideClearance * 2);

  const tableSpacing = MIN_TABLE_SPACING_PX;
  const cellWidth = config.width + tableSpacing;
  const cellHeight = config.height + tableSpacing;

  const cols = Math.floor(availableWidth / cellWidth);
  const rows = Math.floor(availableHeight / cellHeight);

  const tablesNeeded = Math.ceil(requirements.targetCapacity / config.defaultCapacity);
  const maxTables = cols * rows;

  const tablesToPlace = Math.min(tablesNeeded, maxTables);
  let tablesPlaced = 0;

  for (let row = 0; row < rows && tablesPlaced < tablesToPlace; row++) {
    for (let col = 0; col < cols && tablesPlaced < tablesToPlace; col++) {
      const x = sideClearance + (col * cellWidth) + tableSpacing / 2;
      const y = sideClearance + (row * cellHeight) + tableSpacing / 2;

      items.push({
        type: "ROUND_TABLE",
        x,
        y,
        rotation: 0,
        capacity: config.defaultCapacity,
        width: config.width,
        height: config.height,
      });

      totalCapacity += config.defaultCapacity;
      tablesPlaced++;
    }
  }

  return { items, totalCapacity, efficiency: 0, aisleCount: 0, warnings: [] };
}

/**
 * Generate classroom-style layout (rows of tables)
 */
function generateClassroomLayout(
  canvasWidth: number,
  canvasHeight: number,
  requirements: SeatingRequirements,
  frontClearance: number,
  sideClearance: number,
  aisleWidth: number
): GeneratedLayout {
  const items: any[] = [];
  let totalCapacity = 0;

  const config = furnitureConfigs.RECTANGULAR_TABLE;
  
  const availableWidth = canvasWidth - (sideClearance * 2);
  const availableHeight = canvasHeight - frontClearance - sideClearance;

  const tablesPerRow = Math.floor(availableWidth / (config.width + 40));
  const rowHeight = config.height + MIN_ROW_SPACING_PX;
  const maxRows = Math.floor(availableHeight / rowHeight);

  for (let row = 0; row < maxRows; row++) {
    const y = frontClearance + (row * rowHeight);
    
    for (let col = 0; col < tablesPerRow; col++) {
      const x = sideClearance + (col * (config.width + 40));
      
      items.push({
        type: "RECTANGULAR_TABLE",
        x,
        y,
        rotation: 0,
        capacity: config.defaultCapacity,
        width: config.width,
        height: config.height,
      });

      totalCapacity += config.defaultCapacity;
    }
  }

  return { items, totalCapacity, efficiency: 0, aisleCount: 0, warnings: [] };
}

/**
 * Generate mixed layout (combination based on capacity optimization)
 */
function generateMixedLayout(
  canvasWidth: number,
  canvasHeight: number,
  requirements: SeatingRequirements,
  frontClearance: number,
  backClearance: number,
  sideClearance: number,
  aisleWidth: number
): GeneratedLayout {
  // Start with theater layout for majority
  const theaterLayout = generateTheaterLayout(
    canvasWidth,
    canvasHeight - 200, // Reserve back area
    requirements,
    frontClearance,
    0,
    sideClearance,
    aisleWidth
  );

  // Add some round tables in the back for overflow/special seating
  const backTableY = canvasHeight - backClearance - 100;
  const tableConfig = furnitureConfigs.ROUND_TABLE;
  const tablesInBack = Math.floor((canvasWidth - sideClearance * 2) / (tableConfig.width + 40));

  for (let i = 0; i < Math.min(tablesInBack, 3); i++) {
    const x = sideClearance + (i * (tableConfig.width + 40));
    theaterLayout.items.push({
      type: "ROUND_TABLE",
      x,
      y: backTableY,
      rotation: 0,
      capacity: tableConfig.defaultCapacity,
      width: tableConfig.width,
      height: tableConfig.height,
    });
    theaterLayout.totalCapacity += tableConfig.defaultCapacity;
  }

  return theaterLayout;
}

/**
 * Generate front elements (altar, pulpit, stage)
 */
function generateFrontElements(
  canvasWidth: number,
  frontClearance: number,
  requirements: SeatingRequirements
): any[] {
  const items: any[] = [];

  if (requirements.includeAltar) {
    const altarConfig = furnitureConfigs.ALTAR;
    items.push({
      type: "ALTAR",
      x: canvasWidth / 2 - altarConfig.width / 2,
      y: 30,
      rotation: 0,
      capacity: 0,
      width: altarConfig.width,
      height: altarConfig.height,
    });
  }

  if (requirements.includePulpit) {
    const pulpitConfig = furnitureConfigs.PULPIT;
    items.push({
      type: "PULPIT",
      x: canvasWidth / 2 - pulpitConfig.width / 2,
      y: frontClearance - pulpitConfig.height - 20,
      rotation: 0,
      capacity: 0,
      width: pulpitConfig.width,
      height: pulpitConfig.height,
    });
  }

  return items;
}

/**
 * Generate back elements (sound desk, camera)
 */
function generateBackElements(
  canvasWidth: number,
  canvasHeight: number,
  backClearance: number,
  requirements: SeatingRequirements
): any[] {
  const items: any[] = [];

  if (requirements.includeSoundDesk) {
    const soundConfig = furnitureConfigs.SOUND_DESK;
    items.push({
      type: "SOUND_DESK",
      x: canvasWidth / 2 - soundConfig.width / 2,
      y: canvasHeight - backClearance + 20,
      rotation: 0,
      capacity: 0,
      width: soundConfig.width,
      height: soundConfig.height,
    });
  }

  if (requirements.includeCamera) {
    const cameraConfig = furnitureConfigs.CAMERA_TRIPOD;
    items.push({
      type: "CAMERA_TRIPOD",
      x: canvasWidth - 100,
      y: canvasHeight - backClearance + 20,
      rotation: 0,
      capacity: 0,
      width: cameraConfig.width,
      height: cameraConfig.height,
    });
  }

  return items;
}

/**
 * Calculate total area used by furniture
 */
function calculateUsedArea(items: any[]): number {
  return items.reduce((total, item) => {
    return total + (item.width * item.height);
  }, 0);
}
