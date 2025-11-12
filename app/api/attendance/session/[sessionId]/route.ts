import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTotalSessionAttendance } from "@/lib/attendance/calculations";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;
    const total = await getTotalSessionAttendance(sessionId);

    return NextResponse.json({
      sessionId,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching session attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch session attendance" },
      { status: 500 }
    );
  }
}

