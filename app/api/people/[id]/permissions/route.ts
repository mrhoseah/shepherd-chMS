import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// PATCH - Update user's canLogin permission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { canLogin, permissions, status } = body;

    // Get current user data
    const currentUserData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        canLogin: true,
        permissions: true,
      },
    });

    if (!currentUserData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Validation: Can't enable login if status is not ACTIVE
    if (canLogin === true && currentUserData.status !== "ACTIVE" && status !== "ACTIVE") {
      return NextResponse.json(
        { 
          error: `Cannot grant login access. User status is ${currentUserData.status}. Please set status to ACTIVE first.`,
          requiresStatusChange: true,
          currentStatus: currentUserData.status,
        },
        { status: 400 }
      );
    }

    // If enabling login, ensure status is ACTIVE
    const updateData: any = {};
    if (canLogin !== undefined) {
      updateData.canLogin = canLogin;
      // Auto-set status to ACTIVE if enabling login
      if (canLogin === true && currentUserData.status !== "ACTIVE") {
        updateData.status = "ACTIVE";
      }
    }
    if (permissions !== undefined) {
      updateData.permissions = permissions;
    }
    if (status !== undefined) {
      updateData.status = status;
      // If setting status to non-ACTIVE, revoke login access
      if (status !== "ACTIVE" && currentUserData.canLogin) {
        updateData.canLogin = false;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        canLogin: true,
        permissions: true,
      },
    });

    // Log activity
    const changes: string[] = [];
    if (canLogin !== undefined && canLogin !== currentUserData.canLogin) {
      changes.push(`Login access ${canLogin ? "granted" : "revoked"}`);
    }
    if (status !== undefined && status !== currentUserData.status) {
      changes.push(`Status changed from ${currentUserData.status} to ${status}`);
    }
    if (permissions !== undefined) {
      changes.push("Permissions updated");
    }

    if (changes.length > 0) {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: "UPDATE_USER_PERMISSIONS",
          resource: "User",
          resourceId: id,
          metadata: {
            targetUserId: id,
            targetUserEmail: user.email,
            changes: changes,
            previousCanLogin: currentUserData.canLogin,
            newCanLogin: user.canLogin,
            previousStatus: currentUserData.status,
            newStatus: user.status,
          },
        },
      });
    }

    // Create notification for the user if login access was granted
    if (canLogin === true && !currentUserData.canLogin && user.email) {
      try {
        await prisma.notification.create({
          data: {
            userId: id,
            type: "IN_APP",
            title: "Dashboard Access Granted",
            content: `You now have access to the Eastgate Church Management System dashboard. You can log in with your email: ${user.email}`,
            link: "/dashboard",
          },
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Don't fail the request if notification fails
      }
    }

    // Create notification if login access was revoked
    if (canLogin === false && currentUserData.canLogin && user.email) {
      try {
        await prisma.notification.create({
          data: {
            userId: id,
            type: "IN_APP",
            title: "Dashboard Access Revoked",
            content: "Your dashboard access has been revoked. Please contact an administrator if you believe this is an error.",
          },
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error updating user permissions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user permissions" },
      { status: 500 }
    );
  }
}

// GET - Get user's permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        canLogin: true,
        permissions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user permissions" },
      { status: 500 }
    );
  }
}

