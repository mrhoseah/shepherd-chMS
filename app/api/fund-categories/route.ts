import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateFundCode } from "@/lib/services/paybill-parser";

// GET - List all fund categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const fundCategories = await prisma.fundCategory.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ fundCategories });
  } catch (error: any) {
    console.error("Error fetching fund categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund categories" },
      { status: 500 }
    );
  }
}

// POST - Create new fund category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and pastors can create fund categories
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "PASTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, description, isActive } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and name are required" },
        { status: 400 }
      );
    }

    // Validate fund code format
    const validation = validateFundCode(code);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.fundCategory.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Fund code already exists" },
        { status: 409 }
      );
    }

    const fundCategory = await prisma.fundCategory.create({
      data: {
        code: code.toUpperCase(),
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(fundCategory, { status: 201 });
  } catch (error: any) {
    console.error("Error creating fund category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Fund code already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create fund category" },
      { status: 500 }
    );
  }
}

