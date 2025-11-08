import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/casbin";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      "volunteers",
      "view"
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const active = await prisma.volunteerAssignment.count({
      where: { status: "active" },
    });

    // Calculate fulfillment rate (simplified - you can enhance this)
    const totalAssignments = await prisma.volunteerAssignment.count();
    const fulfillmentRate = totalAssignments > 0 
      ? Math.round((active / totalAssignments) * 100) 
      : 0;

    return NextResponse.json({
      active,
      fulfillmentRate,
    });
  } catch (error: any) {
    console.error("Error fetching active volunteers:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

