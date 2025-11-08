import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all rotations for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");

    const where: any = {
      groupId: id,
      isActive: true,
    };

    if (year) {
      where.year = parseInt(year);
    }

    const rotations = await prisma.groupMeetingRotation.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            residence: true,
          },
        },
        _count: {
          select: {
            meetings: true,
          },
        },
      },
      orderBy: [
        { year: "desc" },
        { month: "asc" },
      ],
    });

    return NextResponse.json({ rotations });
  } catch (error: any) {
    console.error("Error fetching rotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch rotations" },
      { status: 500 }
    );
  }
}

// POST - Create or update rotation for a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      locationType,
      memberId,
      locationName,
      address,
      month,
      year,
      notes,
    } = body;

    if (!locationType || !month || !year) {
      return NextResponse.json(
        { error: "Location type, month, and year are required" },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Month must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Validate location type
    const validTypes = ["member-house", "church", "other"];
    if (!validTypes.includes(locationType)) {
      return NextResponse.json(
        { error: `Location type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // If member-house, memberId is required
    if (locationType === "member-house" && !memberId) {
      return NextResponse.json(
        { error: "Member ID is required for member-house location type" },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await prisma.smallGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if rotation already exists for this month/year
    const existing = await prisma.groupMeetingRotation.findUnique({
      where: {
        groupId_month_year: {
          groupId: id,
          month,
          year,
        },
      },
    });

    let rotation;
    if (existing) {
      // Update existing rotation
      rotation = await prisma.groupMeetingRotation.update({
        where: { id: existing.id },
        data: {
          locationType,
          memberId: locationType === "member-house" ? memberId : null,
          locationName: locationName || null,
          address: address || null,
          notes: notes || null,
          isActive: true,
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true,
              residence: true,
            },
          },
        },
      });
    } else {
      // Create new rotation
      rotation = await prisma.groupMeetingRotation.create({
        data: {
          groupId: id,
          locationType,
          memberId: locationType === "member-house" ? memberId : null,
          locationName: locationName || null,
          address: address || null,
          month,
          year,
          notes: notes || null,
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true,
              residence: true,
            },
          },
        },
      });
    }

    return NextResponse.json(rotation, { status: existing ? 200 : 201 });
  } catch (error: any) {
    console.error("Error creating/updating rotation:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Rotation already exists for this month and year" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to save rotation" },
      { status: 500 }
    );
  }
}

