import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all master events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const campusId = searchParams.get("campusId");
    const groupId = searchParams.get("groupId");
    const isActive = searchParams.get("isActive");

    const where: any = {};

    if (type) where.type = type;
    if (campusId) where.campusId = campusId;
    if (groupId) where.groupId = groupId;
    if (isActive !== null) where.isActive = isActive === "true";

    const masterEvents = await prisma.masterEvent.findMany({
      where,
      include: {
        campus: {
          select: { id: true, name: true },
        },
        group: {
          select: { id: true, name: true },
        },
        servicePlan: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            attendanceSessions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ masterEvents });
  } catch (error: any) {
    console.error("Error fetching master events:", error);
    return NextResponse.json(
      { error: "Failed to fetch master events" },
      { status: 500 }
    );
  }
}

// POST - Create new master event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
      console.log("Received request body:", JSON.stringify(body, null, 2));
    } catch (parseError: any) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON.", details: parseError.message },
        { status: 400 }
      );
    }
    const {
      name,
      description,
      type,
      recurrencePattern,
      isRecurring,
      campusId,
      groupId,
      defaultStartTime,
      defaultDuration,
      servicePlanId,
      isActive,
      tags,
      notes,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    
    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { error: "Type is required and must be a string" },
        { status: 400 }
      );
    }

    // Normalize empty strings to null
    const normalizedCampusId = campusId && campusId !== "" ? campusId : null;
    const normalizedGroupId = groupId && groupId !== "" ? groupId : null;
    const normalizedServicePlanId = servicePlanId && servicePlanId !== "" ? servicePlanId : null;
    const normalizedDefaultStartTime = defaultStartTime && defaultStartTime !== "" ? defaultStartTime : null;
    const normalizedDefaultDuration = defaultDuration !== null && defaultDuration !== undefined && defaultDuration !== "" 
      ? parseInt(String(defaultDuration)) 
      : null;

    // Validate type is a valid MasterEventType
    const validTypes = ["SERVICE", "GROUP", "EVENT", "MEETING", "FELLOWSHIP", "TRAINING", "OUTREACH", "OTHER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate referenced IDs exist if provided
    if (normalizedCampusId) {
      const campus = await prisma.campus.findUnique({
        where: { id: normalizedCampusId },
      });
      if (!campus) {
        return NextResponse.json(
          { error: "Campus not found" },
          { status: 400 }
        );
      }
    }

    if (normalizedGroupId) {
      const group = await prisma.smallGroup.findUnique({
        where: { id: normalizedGroupId },
      });
      if (!group) {
        return NextResponse.json(
          { error: "Group not found" },
          { status: 400 }
        );
      }
    }

    if (normalizedServicePlanId) {
      try {
        const servicePlan = await prisma.servicePlan.findUnique({
          where: { id: normalizedServicePlanId },
        });
        if (!servicePlan) {
          return NextResponse.json(
            { error: "Service plan not found" },
            { status: 400 }
          );
        }
      } catch (servicePlanError) {
        // ServicePlan model might not exist, skip validation
        console.warn("ServicePlan validation skipped:", servicePlanError);
      }
    }

    console.log("Creating master event with data:", {
      name: name.trim(),
      type,
      campusId: normalizedCampusId,
      groupId: normalizedGroupId,
      defaultStartTime: normalizedDefaultStartTime,
      defaultDuration: normalizedDefaultDuration,
    });

    const masterEvent = await prisma.masterEvent.create({
      data: {
        name: name.trim(),
        description: description && description.trim() !== "" ? description.trim() : null,
        type,
        recurrencePattern: recurrencePattern && recurrencePattern.trim() !== "" ? recurrencePattern.trim() : null,
        isRecurring: isRecurring || false,
        campusId: normalizedCampusId,
        groupId: normalizedGroupId,
        defaultStartTime: normalizedDefaultStartTime,
        defaultDuration: normalizedDefaultDuration,
        servicePlanId: normalizedServicePlanId,
        isActive: isActive !== undefined ? isActive : true,
        tags: tags && Array.isArray(tags) ? tags : [],
        notes: notes && notes.trim() !== "" ? notes.trim() : null,
      },
      include: {
        campus: {
          select: { id: true, name: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    });

    console.log("Master event created successfully:", masterEvent.id);
    return NextResponse.json(masterEvent, { status: 201 });
  } catch (error: any) {
    console.error("Error creating master event:", error);
    console.error("Error stack:", error.stack);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);
    
    // Provide more detailed error messages
    let errorMessage = "Failed to create master event";
    let statusCode = 500;
    
    if (error.code === "P2002") {
      errorMessage = "A master event with this name already exists";
      statusCode = 409; // Conflict
    } else if (error.code === "P2003") {
      errorMessage = "Invalid reference (campus, group, or service plan not found)";
      statusCode = 400;
    } else if (error.code === "P2012") {
      errorMessage = "Required field is missing";
      statusCode = 400;
    } else if (error.meta?.target) {
      errorMessage = `Validation error: ${error.meta.target.join(", ")}`;
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.code || error.message,
        code: error.code,
      },
      { status: statusCode }
    );
  }
}

