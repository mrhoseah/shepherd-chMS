import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
        executions: {
          take: 1,
          orderBy: { startedAt: "desc" },
        },
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedWorkflows = workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.triggerType,
      conditions: workflow.triggerConfig || {},
      actions: workflow.actions.map((action) => ({
        type: action.type,
        config: action.config,
        order: action.order,
      })),
      enabled: workflow.isActive && workflow.status === "ACTIVE",
      lastRun: workflow.executions[0]?.startedAt?.toISOString(),
      runCount: workflow._count.executions,
      status: workflow.status,
    }));

    return NextResponse.json({ workflows: formattedWorkflows });
  } catch (error: any) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, trigger, enabled, actions = [] } = body;

    if (!name || !trigger) {
      return NextResponse.json(
        { error: "Name and trigger are required" },
        { status: 400 }
      );
    }

    // Map trigger string to enum
    const triggerMap: Record<string, any> = {
      member_created: "MEMBER_CREATED",
      member_updated: "MEMBER_UPDATED",
      member_inactive: "MEMBER_UPDATED",
      donation_received: "DONATION_RECEIVED",
      event_created: "EVENT_REGISTERED",
      attendance_missed: "ATTENDANCE_MISSED",
      birthday: "CUSTOM",
      anniversary: "CUSTOM",
      guest_registered: "MEMBER_CREATED",
    };

    const triggerType = triggerMap[trigger] || "CUSTOM";

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        triggerType,
        triggerConfig: { originalTrigger: trigger },
        authorId: session.user.id,
        isActive: enabled !== false,
        status: enabled !== false ? "ACTIVE" : "DRAFT",
        actions: {
          create: actions.map((action: any, index: number) => ({
            type: action.type || "SEND_EMAIL",
            order: index,
            config: action.config || {},
            conditions: action.conditions || null,
            delay: action.delay || null,
          })),
        },
      },
      include: {
        actions: true,
      },
    });

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}
