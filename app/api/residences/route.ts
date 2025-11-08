import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all residences for the church
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get user's church (for now, get first active church)
    // In a multi-church system, you'd get this from the user's association
    const church = await prisma.church.findFirst({
      where: { isActive: true },
    });

    if (!church) {
      return NextResponse.json(
        { error: "No active church found" },
        { status: 404 }
      );
    }

    const where: any = {
      churchId: church.id,
      isActive: true,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const residences = await prisma.residence.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ residences });
  } catch (error: any) {
    console.error("Error fetching residences:", error);
    return NextResponse.json(
      { error: "Failed to fetch residences" },
      { status: 500 }
    );
  }
}

// POST - Create a new residence
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Residence name is required" },
        { status: 400 }
      );
    }

    // Get user's church
    const church = await prisma.church.findFirst({
      where: { isActive: true },
    });

    if (!church) {
      return NextResponse.json(
        { error: "No active church found" },
        { status: 404 }
      );
    }

    const trimmedName = name.trim();

    // Check if residence already exists
    const existing = await prisma.residence.findUnique({
      where: {
        churchId_name: {
          churchId: church.id,
          name: trimmedName,
        },
      },
    });

    if (existing) {
      // If it exists but is inactive, reactivate it
      if (!existing.isActive) {
        const updated = await prisma.residence.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        return NextResponse.json(updated, { status: 200 });
      }
      return NextResponse.json(existing, { status: 200 });
    }

    // Create new residence
    const residence = await prisma.residence.create({
      data: {
        name: trimmedName,
        churchId: church.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(residence, { status: 201 });
  } catch (error: any) {
    console.error("Error creating residence:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Residence already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create residence" },
      { status: 500 }
    );
  }
}

