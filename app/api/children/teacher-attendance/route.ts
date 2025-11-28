import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List teacher's current classes or attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { campus: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const classId = searchParams.get("classId");

    // Get teacher's assigned classes for today
    if (!date && !classId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const classes = await prisma.childrenClass.findMany({
        where: {
          OR: [
            { leaderId: user.id },
            {
              leadershipAssignments: {
                some: {
                  userId: user.id,
                },
              },
            },
          ],
          isActive: true,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
          _count: {
            select: { members: true },
          },
        },
      });

      return NextResponse.json({ classes });
    }

    // Get attendance records
    const where: any = {};
    if (date) where.date = new Date(date);
    if (classId) where.classId = classId;
    where.teacherId = user.id;

    const records = await prisma.teacherAttendance.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            ageMin: true,
            ageMax: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ records });
  } catch (error: any) {
    console.error("Error fetching teacher attendance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST - Record teacher check-in and start attendance
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
    const { classId, date, notes } = body;

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    const sessionDate = date ? new Date(date) : new Date();
    sessionDate.setHours(0, 0, 0, 0);

    // Create or update teacher attendance
    const attendance = await prisma.teacherAttendance.upsert({
      where: {
        teacherId_classId_date: {
          teacherId: user.id,
          classId,
          date: sessionDate,
        },
      },
      create: {
        teacherId: user.id,
        classId,
        date: sessionDate,
        checkInAt: new Date(),
        status: "present",
        notes,
      },
      update: {
        checkInAt: new Date(),
        status: "present",
        notes,
      },
      include: {
        class: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                    childProfiles: {
                      where: {
                        parentId: user.id,
                      },
                      select: {
                        allergies: true,
                        medications: true,
                        parentDailyNotes: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error: any) {
    console.error("Error recording teacher attendance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record attendance" },
      { status: 500 }
    );
  }
}

// PUT - Finalize attendance (check-out)
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
    const { attendanceId, totalChildren, presentChildren, newVisitors } = body;

    const attendance = await prisma.teacherAttendance.update({
      where: { id: attendanceId },
      data: {
        checkOutAt: new Date(),
        totalChildren,
        presentChildren,
        newVisitors,
      },
    });

    return NextResponse.json({ attendance });
  } catch (error: any) {
    console.error("Error finalizing attendance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to finalize attendance" },
      { status: 500 }
    );
  }
}
