import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
        executions: {
          take: 10,
          orderBy: { startedAt: "desc" },
          include: {
            actionExecutions: {
              include: {
                action: true,
              },
            },
          },
        },
        _count: {
          select: { executions: true },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, trigger, enabled, actions, status } = body;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // If updating enabled status
    if (enabled !== undefined) {
      const updated = await prisma.workflow.update({
        where: { id },
        data: {
          isActive: enabled,
          status: enabled ? "ACTIVE" : "PAUSED",
        },
      });
      return NextResponse.json({ workflow: updated });
    }

    // Full update
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (enabled !== undefined) {
      updateData.isActive = enabled;
      updateData.status = enabled ? "ACTIVE" : "PAUSED";
    }

    // Update actions if provided
    if (actions && Array.isArray(actions)) {
      // Delete existing actions
      await prisma.workflowAction.deleteMany({
        where: { workflowId: id },
      });

      // Create new actions
      updateData.actions = {
        create: actions.map((action: any, index: number) => ({
          type: action.type || "SEND_EMAIL",
          order: index,
          config: action.config || {},
          conditions: action.conditions || null,
          delay: action.delay || null,
        })),
      };
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: updateData,
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ workflow: updated });
  } catch (error: any) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
