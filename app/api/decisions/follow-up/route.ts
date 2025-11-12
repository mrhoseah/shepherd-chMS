import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDecisionsNeedingFollowUp, getDecisionStats } from "@/lib/attendance/decisions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stats = searchParams.get("stats") === "true";

    if (stats) {
      const decisionStats = await getDecisionStats();
      return NextResponse.json(decisionStats);
    }

    const decisions = await getDecisionsNeedingFollowUp();
    return NextResponse.json(decisions);
  } catch (error: any) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions" },
      { status: 500 }
    );
  }
}

