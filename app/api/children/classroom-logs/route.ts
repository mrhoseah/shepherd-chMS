import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Record classroom log (attendance + quick notes)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      childId,
      classId,
      sessionDate,
      isPresent,
      isVisitor,
      behaviorTags,
      engagementLevel,
      notes,
      checkedInAt,
      checkedOutAt,
    } = body;

    // Get or create child profile
    let childProfile = await prisma.childProfile.findFirst({
      where: { childId },
    });

    if (!childProfile) {
      // Create a basic profile if it doesn't exist
      childProfile = await prisma.childProfile.create({
        data: {
          childId,
          parentId: user.id, // Teacher creates initial profile
        },
      });
    }

    // Create classroom log
    const log = await prisma.classroomLog.create({
      data: {
        childProfileId: childProfile.id,
        teacherId: user.id,
        classId,
        sessionDate: sessionDate ? new Date(sessionDate) : new Date(),
        isPresent: isPresent ?? true,
        isVisitor: isVisitor ?? false,
        behaviorTags: behaviorTags || [],
        engagementLevel: engagementLevel || 3,
        notes,
        checkedInAt: checkedInAt ? new Date(checkedInAt) : new Date(),
        checkedOutAt: checkedOutAt ? new Date(checkedOutAt) : null,
      },
      include: {
        childProfile: {
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating classroom log:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create classroom log" },
      { status: 500 }
    );
  }
}

// GET - Get classroom logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const childId = searchParams.get("childId");
    const date = searchParams.get("date");

    const where: any = {};
    if (classId) where.classId = classId;
    if (date) {
      const sessionDate = new Date(date);
      sessionDate.setHours(0, 0, 0, 0);
      where.sessionDate = sessionDate;
    }
    if (childId) {
      where.childProfile = { childId };
    }

    const logs = await prisma.classroomLog.findMany({
      where,
      include: {
        childProfile: {
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { sessionDate: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Error fetching classroom logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// PUT - Batch update classroom logs (for quick attendance marking)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { logs } = body; // Array of log updates

    if (!Array.isArray(logs)) {
      return NextResponse.json({ error: "Logs must be an array" }, { status: 400 });
    }

    // Batch update logs
    const updates = await Promise.all(
      logs.map((log: any) =>
        prisma.classroomLog.update({
          where: { id: log.id },
          data: {
            behaviorTags: log.behaviorTags,
            engagementLevel: log.engagementLevel,
            notes: log.notes,
            checkedOutAt: log.checkedOutAt ? new Date(log.checkedOutAt) : undefined,
          },
        })
      )
    );

    return NextResponse.json({ updated: updates.length });
  } catch (error: any) {
    console.error("Error updating classroom logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update logs" },
      { status: 500 }
    );
  }
}
