import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Seed initial fund categories
 * Only admins can run this
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Default fund categories with codes
    const defaultFunds = [
      { code: "TTH", name: "Tithe", description: "Regular tithe giving" },
      { code: "WLFR", name: "Welfare Fund", description: "Welfare and benevolence fund" },
      { code: "BLDG", name: "Building Fund", description: "Church building and facilities fund" },
      { code: "MSN", name: "Missions", description: "Missions and outreach fund" },
      { code: "SPRJ", name: "Special Project", description: "Special projects and initiatives" },
      { code: "OFFR", name: "Offering", description: "General offering" },
    ];

    const created = [];
    const skipped = [];

    for (const fund of defaultFunds) {
      try {
        const existing = await prisma.fundCategory.findUnique({
          where: { code: fund.code },
        });

        if (existing) {
          skipped.push(fund.code);
          continue;
        }

        const category = await prisma.fundCategory.create({
          data: {
            code: fund.code,
            name: fund.name,
            description: fund.description,
            isActive: true,
          },
        });

        created.push(category);
      } catch (error: any) {
        if (error.code !== "P2002") {
          // Not a duplicate error
          throw error;
        }
        skipped.push(fund.code);
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      funds: created,
      message: `Created ${created.length} fund categories. ${skipped.length} already existed.`,
    });
  } catch (error: any) {
    console.error("Error seeding fund categories:", error);
    return NextResponse.json(
      { error: "Failed to seed fund categories", details: error.message },
      { status: 500 }
    );
  }
}

