import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get groups that share the same meeting location for a given month/year
// This helps identify opportunities for combined meetings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    const rotations = await prisma.groupMeetingRotation.findMany({
      where: {
        month: parseInt(month),
        year: parseInt(year),
        isActive: true,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true,
            meetingDay: true,
            meetingTime: true,
          },
        },
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            residence: true,
          },
        },
      },
    });

    // Group rotations by location
    const locationMap = new Map<string, typeof rotations>();

    for (const rotation of rotations) {
      let key: string;
      
      if (rotation.locationType === "member-house" && rotation.memberId) {
        key = `member-${rotation.memberId}`;
      } else if (rotation.locationType === "church") {
        key = "church";
      } else {
        key = `other-${rotation.locationName || rotation.id}`;
      }

      if (!locationMap.has(key)) {
        locationMap.set(key, []);
      }
      locationMap.get(key)!.push(rotation);
    }

    // Filter to only locations with multiple groups
    const combinedLocations = Array.from(locationMap.entries())
      .filter(([_, groups]) => groups.length > 1)
      .map(([key, groups]) => ({
        locationKey: key,
        locationType: groups[0].locationType,
        member: groups[0].member,
        locationName: groups[0].locationName,
        address: groups[0].address,
        groups: groups.map((g) => ({
          id: g.group.id,
          name: g.group.name,
          type: g.group.type,
          meetingDay: g.group.meetingDay,
          meetingTime: g.group.meetingTime,
        })),
        rotationIds: groups.map((g) => g.id),
      }));

    return NextResponse.json({
      month: parseInt(month),
      year: parseInt(year),
      combinedLocations,
    });
  } catch (error: any) {
    console.error("Error fetching combined meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch combined meetings" },
      { status: 500 }
    );
  }
}

