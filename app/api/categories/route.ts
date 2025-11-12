import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

// GET - List all giving categories (public, but admin can manage)
export async function GET(request: NextRequest) {
  try {
    // Get all enum values from Prisma
    const categories = Object.values(
      await import("@prisma/client").then((m) => m.GivingCategory)
    );

    return NextResponse.json({
      success: true,
      categories: categories.map((cat) => ({
        value: cat,
        label: cat.replace(/_/g, " "),
        description: getCategoryDescription(cat),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Add new category (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permission
    const hasPermission = await checkPermission(
      (session.user as any).id,
      "settings",
      "update"
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Note: Since GivingCategory is an enum, we can't add new values at runtime
    // Instead, we'll store custom categories in ChurchSetting
    // For now, we'll validate that the name matches an existing enum value
    const validCategories = Object.values(
      await import("@prisma/client").then((m) => m.GivingCategory)
    );

    if (validCategories.includes(name as any)) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    // Store custom category in settings
    // This is a workaround - ideally, we'd extend the enum, but Prisma requires schema changes
    // For production, you'd want to migrate the enum or use a separate CustomCategory model

    return NextResponse.json({
      success: true,
      message: "Custom categories require schema migration. Please add to enum in schema.prisma",
    });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

// Helper function to get category descriptions
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    TITHE: "Regular tithe giving (typically 10% of income)",
    OFFERING: "General offering and worship giving",
    MISSIONS: "Missions and outreach support",
    BUILDING_FUND: "Building and facility fund contributions",
    SPECIAL_PROJECT: "Special project or campaign giving",
    OTHER: "Other types of giving",
  };

  return descriptions[category] || "Giving category";
}

