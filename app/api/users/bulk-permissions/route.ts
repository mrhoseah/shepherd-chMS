import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// PATCH - Bulk update user permissions
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { userIds, canLogin, status } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "User IDs array is required" },
        { status: 400 }
      );
    }

    // Validate all users exist and get their current state
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        canLogin: true,
      },
    });

    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: "Some users were not found" },
        { status: 404 }
      );
    }

    // Filter out admins (they can't have permissions changed)
    const nonAdminUsers = users.filter((u) => u.role !== "ADMIN");
    const adminUsers = users.filter((u) => u.role === "ADMIN");

    if (nonAdminUsers.length === 0) {
      return NextResponse.json(
        { 
          error: "No non-admin users selected",
          message: "Admin users cannot have their permissions changed",
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (canLogin !== undefined) {
      updateData.canLogin = canLogin;
      // Auto-set status to ACTIVE if enabling login
      if (canLogin === true) {
        updateData.status = "ACTIVE";
      }
    }
    if (status !== undefined) {
      updateData.status = status;
      // If setting status to non-ACTIVE, revoke login access
      if (status !== "ACTIVE") {
        updateData.canLogin = false;
      }
    }

    // Update users
    const updatedUsers = await prisma.user.updateMany({
      where: {
        id: { in: nonAdminUsers.map((u) => u.id) },
      },
      data: updateData,
    });

    // Log activity for each user
    const changes: string[] = [];
    if (canLogin !== undefined) {
      changes.push(`Login access ${canLogin ? "granted" : "revoked"}`);
    }
    if (status !== undefined) {
      changes.push(`Status set to ${status}`);
    }

    for (const user of nonAdminUsers) {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: "BULK_UPDATE_USER_PERMISSIONS",
          resource: "User",
          resourceId: user.id,
          metadata: {
            targetUserId: user.id,
            targetUserEmail: user.email,
            changes: changes,
            bulkOperation: true,
            affectedUsers: userIds.length,
          },
        },
      });

      // Create notifications
      if (canLogin === true && !user.canLogin && user.email) {
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "IN_APP",
              title: "Dashboard Access Granted",
              content: `You now have access to the Eastgate Church Management System dashboard. You can log in with your email: ${user.email}`,
              link: "/dashboard",
            },
          });
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
        }
      }

      if (canLogin === false && user.canLogin && user.email) {
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "IN_APP",
              title: "Dashboard Access Revoked",
              content: "Your dashboard access has been revoked. Please contact an administrator if you believe this is an error.",
            },
          });
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedUsers.count,
      skipped: adminUsers.length,
      message: `Updated ${updatedUsers.count} user(s)${adminUsers.length > 0 ? `, skipped ${adminUsers.length} admin(s)` : ""}`,
    });
  } catch (error: any) {
    console.error("Error bulk updating user permissions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user permissions" },
      { status: 500 }
    );
  }
}

