import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all departments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            staff: true,
            inventoryItems: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

// POST - Create new department
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, leaderId, isActive = true } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        description: description || null,
        leaderId: leaderId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            staff: true,
            inventoryItems: true,
          },
        },
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    console.error("Error creating department:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Department name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}

