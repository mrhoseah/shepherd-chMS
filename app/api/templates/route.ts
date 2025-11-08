import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all message templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (type) {
      where.type = type;
    }

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { isDefault: "desc" },
        { name: "asc" },
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

// POST - Create a new message template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, type, subject, content, variables, trigger, isDefault } = body;

    if (!name || !category || !type || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults in same category
    if (isDefault) {
      await prisma.messageTemplate.updateMany({
        where: { category, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name,
        category,
        type,
        subject,
        content,
        variables: variables || {},
        trigger,
        isDefault: isDefault || false,
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

