import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { getEnforcer, initializePolicies, reloadEnforcer } from "@/lib/casbin";
import { prisma } from "@/lib/prisma";

// GET - Get all permissions for a role
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");

    const enforcer = await getEnforcer();
    
    if (role) {
      // Get permissions for specific role
      const policies = await enforcer.getFilteredPolicy(0, role.toLowerCase());
      const permissions = policies.map((p: string[]) => ({
        resource: p[1],
        action: p[2],
      }));
      return NextResponse.json({ role, permissions });
    } else {
      // Get all roles and their permissions
      const roles = ["admin", "pastor", "leader"];
      const allPermissions: Record<string, any[]> = {};
      
      for (const r of roles) {
        const policies = await enforcer.getFilteredPolicy(0, r);
        allPermissions[r] = policies.map((p: string[]) => ({
          resource: p[1],
          action: p[2],
        }));
      }
      
      return NextResponse.json({ permissions: allPermissions });
    }
  } catch (error: any) {
    console.error("Error fetching permissions:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to fetch permissions",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// POST - Add permission for a role
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, resource, action } = body;

    if (!role || !resource || !action) {
      return NextResponse.json(
        { error: "Role, resource, and action are required" },
        { status: 400 }
      );
    }

    const enforcer = await getEnforcer();
    const added = await enforcer.addPolicy(role.toLowerCase(), resource, action);
    
    if (added) {
      await enforcer.savePolicy();
      await reloadEnforcer(); // Reload to ensure changes are reflected
      return NextResponse.json({
        message: "Permission added successfully",
        role,
        resource,
        action,
      });
    } else {
      return NextResponse.json(
        { error: "Permission already exists" },
        { status: 409 }
      );
    }
  } catch (error: any) {
    console.error("Error adding permission:", error);
    return NextResponse.json(
      { error: "Failed to add permission" },
      { status: 500 }
    );
  }
}

// DELETE - Remove permission for a role
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const resource = searchParams.get("resource");
    const action = searchParams.get("action");

    if (!role || !resource || !action) {
      return NextResponse.json(
        { error: "Role, resource, and action are required" },
        { status: 400 }
      );
    }

    const enforcer = await getEnforcer();
    const removed = await enforcer.removePolicy(role.toLowerCase(), resource, action);
    
    if (removed) {
      await enforcer.savePolicy();
      await reloadEnforcer(); // Reload to ensure changes are reflected
      return NextResponse.json({
        message: "Permission removed successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("Error removing permission:", error);
    return NextResponse.json(
      { error: "Failed to remove permission" },
      { status: 500 }
    );
  }
}

// PUT - Initialize default policies
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      );
    }

    await initializePolicies();
    return NextResponse.json({ message: "Policies initialized successfully" });
  } catch (error: any) {
    console.error("Error initializing policies:", error);
    return NextResponse.json(
      { error: "Failed to initialize policies" },
      { status: 500 }
    );
  }
}

