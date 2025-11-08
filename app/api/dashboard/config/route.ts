import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/casbin";
import { getDashboardConfig, getSpecializedDashboard } from "@/lib/dashboard-config";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's permissions
    const permissions: { resource: string; action: string }[] = [];
    
    // Check common permissions
    const resources = [
      "users",
      "donations",
      "events",
      "groups",
      "communications",
      "volunteers",
      "reports",
      "settings",
    ];
    
    const actions = ["view", "create", "update", "delete", "manage"];
    
    for (const resource of resources) {
      for (const action of actions) {
        const hasPermission = await checkPermission(user.id, resource, action);
        if (hasPermission) {
          permissions.push({ resource, action });
        }
      }
    }

    // Get specialized dashboard first (if user has specific permissions)
    const specializedDashboard = getSpecializedDashboard(user.role, permissions);
    
    // Use specialized dashboard if available, otherwise use role-based dashboard
    const dashboardConfig = specializedDashboard || getDashboardConfig(user.role, permissions);

    return NextResponse.json({
      config: dashboardConfig,
      permissions,
      role: user.role,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard config:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard configuration" },
      { status: 500 }
    );
  }
}

