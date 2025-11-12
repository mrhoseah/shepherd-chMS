import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTotalDailyAttendance, getAttendanceForDate, getAttendanceBreakdown } from "@/lib/attendance/calculations";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const sessionId = searchParams.get("sessionId");
    const breakdown = searchParams.get("breakdown") === "true";

    const date = dateParam ? new Date(dateParam) : new Date();

    if (breakdown) {
      const result = await getAttendanceBreakdown(date);
      return NextResponse.json(result);
    }

    if (sessionId) {
      const result = await getAttendanceForDate(date, sessionId);
      return NextResponse.json(result);
    }

    const total = await getTotalDailyAttendance(date);
    return NextResponse.json({
      date: date.toISOString(),
      total,
    });
  } catch (error: any) {
    console.error("Error fetching daily attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily attendance" },
      { status: 500 }
    );
  }
}

