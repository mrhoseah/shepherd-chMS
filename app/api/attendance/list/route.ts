import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attendance/list
 * Get list of attendees for a specific reference
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "service" | "event" | "group" | "session" | null;
    const referenceId = searchParams.get("referenceId");

    if (!type || !referenceId) {
      return NextResponse.json(
        { error: "Missing required parameters: type and referenceId" },
        { status: 400 }
      );
    }

    let attendees: any[] = [];

    switch (type) {
      case "session":
        // Check if this is a new AttendanceSession or legacy ServiceSession
        const attendanceSession = await prisma.attendanceSession.findUnique({
          where: { id: referenceId },
        });

        if (attendanceSession) {
          // Use universal AttendanceRecord system
          const records = await prisma.attendanceRecord.findMany({
            where: { sessionId: referenceId },
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
            orderBy: {
              checkedInAt: "desc",
            },
          });
          attendees = records.map((r) => ({
            id: r.id,
            userId: r.userId,
            user: r.user,
            checkedInAt: r.checkedInAt,
            checkInMethod: r.checkInMethod,
            status: r.status,
          }));
        } else {
          // Fallback to legacy ServiceSession system
          const sessionAttendees = await prisma.sessionAttendee.findMany({
            where: { sessionId: referenceId },
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
            orderBy: {
              checkedInAt: "desc",
            },
          });
          attendees = sessionAttendees.map((a) => ({
            id: a.id,
            userId: a.userId,
            user: a.user,
            checkedInAt: a.checkedInAt,
            checkInMethod: a.checkInMethod,
          }));
        }
        break;

      case "event":
        const eventCheckIns = await prisma.eventCheckIn.findMany({
          where: { eventId: referenceId },
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
          orderBy: {
            checkedInAt: "desc",
          },
        });
        attendees = eventCheckIns.map((c) => ({
          id: c.id,
          userId: c.userId,
          user: c.user,
          checkedInAt: c.checkedInAt,
          checkInMethod: c.method,
        }));
        break;

      case "group":
        const groupAttendees = await prisma.groupMeetingAttendance.findMany({
          where: { meetingId: referenceId },
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
          orderBy: {
            createdAt: "desc",
          },
        });
        attendees = groupAttendees.map((a) => ({
          id: a.id,
          userId: a.userId,
          user: a.user,
          checkedInAt: a.createdAt,
          status: a.status,
        }));
        break;

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      type,
      referenceId,
      count: attendees.length,
      attendees,
    });
  } catch (error: any) {
    console.error("Error fetching attendance list:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance list" },
      { status: 500 }
    );
  }
}

