import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAttendanceByReference, getTotalDailyAttendance, getAttendanceBreakdown } from "@/lib/attendance/calculations";

/**
 * GET /api/attendance
 * Get attendance for a specific reference (event, session, group meeting, etc.)
 * 
 * Query params:
 * - type: "service" | "event" | "group" | "session"
 * - referenceId: ID of the event/session/group meeting
 * - date: Date string (for daily attendance)
 * - breakdown: "true" to get detailed breakdown
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
    const date = searchParams.get("date");
    const breakdown = searchParams.get("breakdown") === "true";

    // Get breakdown for a date
    if (breakdown && date) {
      const result = await getAttendanceBreakdown(new Date(date));
      return NextResponse.json(result);
    }

    // Get daily attendance
    if (date && !referenceId) {
      const attendanceType = searchParams.get("attendanceType") as "service" | "event" | "group" | "all" | null;
      const total = await getTotalDailyAttendance(new Date(date), attendanceType || "all");
      return NextResponse.json({
        date: date,
        type: attendanceType || "all",
        total,
      });
    }

    // Get attendance for a specific reference
    if (type && referenceId) {
      const total = await getAttendanceByReference(type, referenceId);
      return NextResponse.json({
        type,
        referenceId,
        total,
      });
    }

    return NextResponse.json(
      { error: "Missing required parameters: type and referenceId, or date" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

