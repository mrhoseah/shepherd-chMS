import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeWorkflows } from "@/lib/workflow-engine";

/**
 * Manual workflow execution endpoint (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can manually trigger workflows
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Trigger type is required" },
        { status: 400 }
      );
    }

    await executeWorkflows({
      type,
      ...data,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error executing workflows:", error);
    return NextResponse.json(
      { error: "Failed to execute workflows" },
      { status: 500 }
    );
  }
}

