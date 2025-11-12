import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Leadership Assignments API
 * Professional leadership system supporting multiple leaders with titles
 */

// GET - List leadership assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const userId = searchParams.get("userId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Filter out inactive assignments (those with endDate in the past)
    if (!includeInactive) {
      where.OR = [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ];
    }

    const assignments = await prisma.leadershipAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        childrenClass: {
          select: {
            id: true,
            name: true,
          },
        },
        youthGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { isPrimary: "desc" },
        { displayOrder: "asc" },
        { startDate: "desc" },
      ],
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error("Error fetching leadership assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch leadership assignments" },
      { status: 500 }
    );
  }
}

// POST - Create new leadership assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      entityType,
      entityId,
      title,
      isPrimary = false,
      displayOrder = 0,
      startDate,
      endDate,
      description,
      notes,
    } = body;

    // Validation
    if (!userId || !entityType || !entityId || !title) {
      return NextResponse.json(
        { error: "userId, entityType, entityId, and title are required" },
        { status: 400 }
      );
    }

    // Build the data object with appropriate relation field
    const assignmentData: any = {
      userId,
      entityType,
      entityId,
      title: title.trim(),
      isPrimary,
      displayOrder,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      description: description?.trim() || null,
      notes: notes?.trim() || null,
    };

    // Set the appropriate relation field based on entityType
    switch (entityType) {
      case "DEPARTMENT":
        assignmentData.departmentId = entityId;
        break;
      case "GROUP":
        assignmentData.groupId = entityId;
        break;
      case "CHILDREN_CLASS":
        assignmentData.childrenClassId = entityId;
        break;
      case "YOUTH_GROUP":
        assignmentData.youthGroupId = entityId;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid entityType" },
          { status: 400 }
        );
    }

    // If this is marked as primary, unset other primary assignments for this entity
    if (isPrimary) {
      await prisma.leadershipAssignment.updateMany({
        where: {
          entityType,
          entityId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const assignment = await prisma.leadershipAssignment.create({
      data: assignmentData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating leadership assignment:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This leadership assignment already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create leadership assignment" },
      { status: 500 }
    );
  }
}

