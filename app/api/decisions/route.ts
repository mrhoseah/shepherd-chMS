import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List decisions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkedSessionId = searchParams.get("linkedSessionId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: any = {};
    if (linkedSessionId) {
      where.linkedSessionId = linkedSessionId;
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const decisions = await prisma.decision.findMany({
      where,
      include: {
        proposedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        linkedSession: {
          select: {
            id: true,
            name: true,
            date: true,
            masterEvent: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        proposedAt: "desc",
      },
    });

    return NextResponse.json({ decisions });
  } catch (error: any) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions" },
      { status: 500 }
    );
  }
}

// POST - Create new decision
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      status,
      meetingId,
      linkedSessionId,
      relatedTo,
      relatedToId,
      data,
      options,
      rationale,
      impact,
      risks,
      budgetImpact,
      budgetCategory,
      proposedById,
      approvedById,
      stakeholders,
      effectiveDate,
      notes,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const decision = await prisma.decision.create({
      data: {
        title,
        description: description || null,
        category: category || "OTHER",
        priority: priority || "NORMAL",
        status: status || "PROPOSED",
        meetingId: meetingId || null,
        linkedSessionId: linkedSessionId || null,
        relatedTo: relatedTo || null,
        relatedToId: relatedToId || null,
        data: data || null,
        options: options || null,
        rationale: rationale || null,
        impact: impact || null,
        risks: risks || null,
        budgetImpact: budgetImpact ? parseFloat(budgetImpact) : null,
        budgetCategory: budgetCategory || null,
        proposedById: proposedById || session.user.id,
        approvedById: approvedById || null,
        stakeholders: stakeholders || [],
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        notes: notes || null,
      },
      include: {
        proposedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        linkedSession: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
      },
    });

    return NextResponse.json({ decision }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating decision:", error);
    return NextResponse.json(
      { error: "Failed to create decision" },
      { status: 500 }
    );
  }
}

