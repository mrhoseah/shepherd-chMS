import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch seating templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get("churchId");
    const category = searchParams.get("category");
    const includePublic = searchParams.get("includePublic") !== "false";

    const where: any = {
      OR: [
        { isPublic: includePublic },
        ...(churchId ? [{ churchId }] : []),
      ],
    };

    if (category) {
      where.category = category;
    }

    const templates = await prisma.seatingTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { isPublic: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category = "CUSTOM",
      templateData,
      churchId,
      isPublic = false,
    } = body;

    if (!name || !templateData) {
      return NextResponse.json(
        { error: "name and templateData are required" },
        { status: 400 }
      );
    }

    // Calculate total capacity
    const totalCapacity = Array.isArray(templateData)
      ? templateData.reduce(
          (sum: number, item: any) => sum + (item.capacity || 0),
          0
        )
      : 0;

    const template = await prisma.seatingTemplate.create({
      data: {
        name,
        description,
        category,
        templateData,
        totalCapacity,
        isPublic,
        churchId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    // Verify template exists and user has permission
    const template = await prisma.seatingTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Only creator or superadmin can delete
    if (template.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.seatingTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
