import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, format } from "date-fns";

/**
 * Total Session Attendance
 * Simple count of all documents in the SessionAttendees collection that match the active sessionId
 */
export async function getTotalSessionAttendance(sessionId: string): Promise<number> {
  const count = await prisma.sessionAttendee.count({
    where: {
      sessionId: sessionId,
    },
  });
  return count;
}

/**
 * Get attendance count for any reference type (event, session, group meeting, etc.)
 */
export async function getAttendanceByReference(
  type: "service" | "event" | "group" | "session",
  referenceId: string
): Promise<number> {
  switch (type) {
    case "session":
      return await prisma.sessionAttendee.count({
        where: { sessionId: referenceId },
      });
    case "event":
      return await prisma.eventCheckIn.count({
        where: { eventId: referenceId },
      });
    case "group":
      return await prisma.groupMeetingAttendance.count({
        where: { meetingId: referenceId },
      });
    case "service":
    default:
      // Use generic Attendance model
      return await prisma.attendance.count({
        where: {
          type: type,
          referenceId: referenceId,
        },
      });
  }
}

/**
 * Total Daily Attendance
 * Run the count across all ServiceSessions for a given day.
 * Then, GROUP BY personId and count the unique personId entries.
 * This prevents double-counting if a member attends both the 9 AM and 11 AM service.
 * 
 * Also supports events and group meetings for the same day.
 */
export async function getTotalDailyAttendance(
  date: Date,
  type?: "service" | "event" | "group" | "all"
): Promise<number> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const userIds = new Set<string>();

  // Get service session attendees
  if (!type || type === "service" || type === "all") {
    const sessions = await prisma.serviceSession.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      const sessionAttendees = await prisma.sessionAttendee.findMany({
        where: {
          sessionId: { in: sessionIds },
        },
        select: { userId: true },
      });
      sessionAttendees.forEach((a) => userIds.add(a.userId));
    }
  }

  // Get event check-ins
  if (!type || type === "event" || type === "all") {
    const events = await prisma.event.findMany({
      where: {
        startDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (events.length > 0) {
      const eventIds = events.map((e) => e.id);
      const eventCheckIns = await prisma.eventCheckIn.findMany({
        where: {
          eventId: { in: eventIds },
        },
        select: { userId: true },
      });
      eventCheckIns.forEach((c) => userIds.add(c.userId));
    }
  }

  // Get group meeting attendees
  if (!type || type === "group" || type === "all") {
    const groupMeetings = await prisma.groupMeeting.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        id: true,
      },
    });

    if (groupMeetings.length > 0) {
      const meetingIds = groupMeetings.map((m) => m.id);
      const groupAttendees = await prisma.groupMeetingAttendance.findMany({
        where: {
          meetingId: { in: meetingIds },
        },
        select: { userId: true },
      });
      groupAttendees.forEach((a) => userIds.add(a.userId));
    }
  }

  // Also check generic Attendance model
  if (!type || type === "all") {
    const genericAttendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: { userId: true },
    });
    genericAttendances.forEach((a) => userIds.add(a.userId));
  }

  return userIds.size;
}

/**
 * Joint Service Aggregation
 * Your system must use the "Total Daily Attendance" logic automatically
 * if any of the service sessions on that day are marked isJointService: true.
 */
export async function getAttendanceForDate(date: Date, sessionId?: string): Promise<{
  total: number;
  method: "session" | "daily";
  isJointService: boolean;
}> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // If a specific session is requested, check if it's part of a joint service day
  if (sessionId) {
    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      select: {
        isJointService: true,
        date: true,
      },
    });

    if (!session) {
      return { total: 0, method: "session", isJointService: false };
    }

    // Check if any session on this day is a joint service
    const sessionsOnDay = await prisma.serviceSession.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        isActive: true,
      },
      select: {
        id: true,
        isJointService: true,
      },
    });

    const hasJointService = sessionsOnDay.some((s) => s.isJointService);

    if (hasJointService) {
      // Use daily attendance logic
      const dailyTotal = await getTotalDailyAttendance(date);
      return {
        total: dailyTotal,
        method: "daily",
        isJointService: true,
      };
    } else {
      // Use session attendance logic
      const sessionTotal = await getTotalSessionAttendance(sessionId);
      return {
        total: sessionTotal,
        method: "session",
        isJointService: false,
      };
    }
  }

  // No specific session - check for joint service on the day
  const sessionsOnDay = await prisma.serviceSession.findMany({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      isActive: true,
    },
    select: {
      id: true,
      isJointService: true,
    },
  });

  const hasJointService = sessionsOnDay.some((s) => s.isJointService);

  if (hasJointService) {
    const dailyTotal = await getTotalDailyAttendance(date);
    return {
      total: dailyTotal,
      method: "daily",
      isJointService: true,
    };
  }

  // No joint service - sum all session attendances
  const sessionIds = sessionsOnDay.map((s) => s.id);
  const total = await prisma.sessionAttendee.count({
    where: {
      sessionId: {
        in: sessionIds,
      },
    },
  });

  return {
    total,
    method: "session",
    isJointService: false,
  };
}

/**
 * Get attendance breakdown for a date
 * Includes services, events, and group meetings
 */
export async function getAttendanceBreakdown(date: Date): Promise<{
  sessions: Array<{
    id: string;
    name: string | null;
    startTime: Date;
    attendance: number;
    isJointService: boolean;
    type: "service" | "event" | "group";
  }>;
  dailyTotal: number;
  uniqueAttendees: number;
  hasJointService: boolean;
  byType: {
    service: number;
    event: number;
    group: number;
  };
}> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Get service sessions
  const sessions = await prisma.serviceSession.findMany({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      isActive: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Get events
  const events = await prisma.event.findMany({
    where: {
      startDate: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: "PUBLISHED",
    },
    orderBy: {
      startDate: "asc",
    },
  });

  // Get group meetings
  const groupMeetings = await prisma.groupMeeting.findMany({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    include: {
      group: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Build session breakdown
  const sessionBreakdown = await Promise.all(
    sessions.map(async (session) => {
      const attendance = await getTotalSessionAttendance(session.id);
      return {
        id: session.id,
        name: session.name,
        startTime: session.startTime,
        attendance,
        isJointService: session.isJointService,
        type: "service" as const,
      };
    })
  );

  // Build event breakdown
  const eventBreakdown = await Promise.all(
    events.map(async (event) => {
      const attendance = await prisma.eventCheckIn.count({
        where: { eventId: event.id },
      });
      return {
        id: event.id,
        name: event.title,
        startTime: event.startDate,
        attendance,
        isJointService: false,
        type: "event" as const,
      };
    })
  );

  // Build group meeting breakdown
  const groupBreakdown = await Promise.all(
    groupMeetings.map(async (meeting) => {
      const attendance = await prisma.groupMeetingAttendance.count({
        where: { meetingId: meeting.id },
      });
      return {
        id: meeting.id,
        name: `${meeting.group.name} Meeting`,
        startTime: meeting.date,
        attendance,
        isJointService: false,
        type: "group" as const,
      };
    })
  );

  const allItems = [...sessionBreakdown, ...eventBreakdown, ...groupBreakdown].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  const hasJointService = sessions.some((s) => s.isJointService);
  const uniqueAttendees = await getTotalDailyAttendance(date, "all");
  const dailyTotal = hasJointService
    ? uniqueAttendees
    : allItems.reduce((sum, item) => sum + item.attendance, 0);

  const byType = {
    service: sessionBreakdown.reduce((sum, s) => sum + s.attendance, 0),
    event: eventBreakdown.reduce((sum, e) => sum + e.attendance, 0),
    group: groupBreakdown.reduce((sum, g) => sum + g.attendance, 0),
  };

  return {
    sessions: allItems,
    dailyTotal,
    uniqueAttendees,
    hasJointService,
    byType,
  };
}

