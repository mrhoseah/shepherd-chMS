import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all communication templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const method = searchParams.get("method");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (type) where.type = type;
    if (method) where.method = method;
    if (isActive !== null) where.isActive = isActive === "true";

    const templates = await prisma.communicationTemplate.findMany({
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
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create a new communication template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, method, subject, content, variables, isActive, isDefault } = body;

    if (!name || !type || !method || !content) {
      return NextResponse.json(
        { error: "Name, type, method, and content are required" },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults for this type/method
    if (isDefault) {
      await prisma.communicationTemplate.updateMany({
        where: {
          type,
          method,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.communicationTemplate.create({
      data: {
        name,
        type,
        method,
        subject: subject || null,
        content,
        variables: variables || null,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
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

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
