import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/attendance/capture
 * Capture attendance for a service session, event, or group meeting
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, referenceId, userIds, checkInMethod = "manual" } = body;

    if (!type || !referenceId || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: "Missing required fields: type, referenceId, userIds" },
        { status: 400 }
      );
    }

    const results = [];

    switch (type) {
      case "session":
        // Check if this is a new AttendanceSession or legacy ServiceSession
        const attendanceSession = await prisma.attendanceSession.findUnique({
          where: { id: referenceId },
        });

        if (attendanceSession) {
          // Use universal AttendanceRecord system
          for (const userId of userIds) {
            try {
              const record = await prisma.attendanceRecord.upsert({
                where: {
                  sessionId_userId: {
                    sessionId: referenceId,
                    userId: userId,
                  },
                },
                create: {
                  sessionId: referenceId,
                  userId: userId,
                  checkInMethod,
                  checkedInAt: new Date(),
                  status: "PRESENT",
                },
                update: {
                  checkInMethod,
                  checkedInAt: new Date(),
                  status: "PRESENT",
                },
              });
              results.push({ userId, success: true, id: record.id });
            } catch (error: any) {
              results.push({ userId, success: false, error: error.message });
            }
          }
        } else {
          // Fallback to legacy ServiceSession system
          for (const userId of userIds) {
            try {
              const attendee = await prisma.sessionAttendee.upsert({
                where: {
                  sessionId_userId: {
                    sessionId: referenceId,
                    userId: userId,
                  },
                },
                create: {
                  sessionId: referenceId,
                  userId: userId,
                  checkInMethod,
                  checkedInAt: new Date(),
                },
                update: {
                  checkInMethod,
                  checkedInAt: new Date(),
                },
              });
              results.push({ userId, success: true, id: attendee.id });
            } catch (error: any) {
              results.push({ userId, success: false, error: error.message });
            }
          }
        }
        break;

      case "event":
        // Capture event check-in
        for (const userId of userIds) {
          try {
            const checkIn = await prisma.eventCheckIn.upsert({
              where: {
                eventId_userId: {
                  eventId: referenceId,
                  userId: userId,
                },
              },
              create: {
                eventId: referenceId,
                userId: userId,
                method: checkInMethod,
                checkedInAt: new Date(),
              },
              update: {
                method: checkInMethod,
                checkedInAt: new Date(),
              },
            });
            results.push({ userId, success: true, id: checkIn.id });
          } catch (error: any) {
            results.push({ userId, success: false, error: error.message });
          }
        }
        break;

      case "group":
        // Capture group meeting attendance
        for (const userId of userIds) {
          try {
            const attendance = await prisma.groupMeetingAttendance.upsert({
              where: {
                meetingId_userId: {
                  meetingId: referenceId,
                  userId: userId,
                },
              },
              create: {
                meetingId: referenceId,
                userId: userId,
                status: "PRESENT",
              },
              update: {
                status: "PRESENT",
              },
            });
            results.push({ userId, success: true, id: attendance.id });
          } catch (error: any) {
            results.push({ userId, success: false, error: error.message });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}. Must be 'session', 'event', or 'group'` },
          { status: 400 }
        );
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      total: userIds.length,
      successful: successCount,
      failed: failureCount,
      results,
    });
  } catch (error: any) {
    console.error("Error capturing attendance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to capture attendance" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attendance/capture
 * Remove attendance record
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const referenceId = searchParams.get("referenceId");
    const userId = searchParams.get("userId");

    if (!type || !referenceId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters: type, referenceId, userId" },
        { status: 400 }
      );
    }

    switch (type) {
      case "session":
        await prisma.sessionAttendee.delete({
          where: {
            sessionId_userId: {
              sessionId: referenceId,
              userId: userId,
            },
          },
        });
        break;

      case "event":
        await prisma.eventCheckIn.delete({
          where: {
            eventId_userId: {
              eventId: referenceId,
              userId: userId,
            },
          },
        });
        break;

      case "group":
        await prisma.groupMeetingAttendance.delete({
          where: {
            meetingId_userId: {
              meetingId: referenceId,
              userId: userId,
            },
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing attendance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove attendance" },
      { status: 500 }
    );
  }
}

