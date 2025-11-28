/**
 * System Admin Church Context Management
 * Allows system admins to switch between churches for support and management
 */
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const CHURCH_CONTEXT_COOKIE = "admin_church_context";
const SYSTEM_ROLES = ["SUPERADMIN", "SYSTEM_ADMIN", "SYSTEM_SUPPORT"];

export interface ChurchContext {
  churchId: string;
  churchName: string;
  churchLogo?: string | null;
}

/**
 * Check if user is a system admin
 */
export function isSystemAdmin(userRole?: string): boolean {
  return userRole ? SYSTEM_ROLES.includes(userRole) : false;
}

/**
 * Get current church context for system admin
 */
export async function getAdminChurchContext(
  userRole: string
): Promise<ChurchContext | null> {
  if (!isSystemAdmin(userRole)) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const contextCookie = cookieStore.get(CHURCH_CONTEXT_COOKIE);

    if (!contextCookie?.value) {
      return null;
    }

    const context = JSON.parse(contextCookie.value) as ChurchContext;

    // Verify church still exists
    const church = await prisma.church.findUnique({
      where: { id: context.churchId },
      select: {
        id: true,
        name: true,
        logo: true,
        isActive: true,
      },
    });

    if (!church) {
      // Church deleted, clear context
      await clearAdminChurchContext();
      return null;
    }

    return {
      churchId: church.id,
      churchName: church.name,
      churchLogo: church.logo,
    };
  } catch (error) {
    console.error("Error getting admin church context:", error);
    return null;
  }
}

/**
 * Set church context for system admin
 */
export async function setAdminChurchContext(
  churchId: string,
  userRole: string,
  userId: string
): Promise<ChurchContext | null> {
  if (!isSystemAdmin(userRole)) {
    throw new Error("Only system admins can set church context");
  }

  try {
    // Verify church exists
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    if (!church) {
      throw new Error("Church not found");
    }

    const context: ChurchContext = {
      churchId: church.id,
      churchName: church.name,
      churchLogo: church.logo,
    };

    // Set cookie (30 days expiry)
    const cookieStore = await cookies();
    cookieStore.set(CHURCH_CONTEXT_COOKIE, JSON.stringify(context), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Create audit log
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "CHURCH_CONTEXT_SET",
        resource: "Church",
        resourceId: churchId,
        metadata: {
          churchName: church.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return context;
  } catch (error) {
    console.error("Error setting admin church context:", error);
    throw error;
  }
}

/**
 * Clear church context for system admin
 */
export async function clearAdminChurchContext(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(CHURCH_CONTEXT_COOKIE);
  } catch (error) {
    console.error("Error clearing admin church context:", error);
    throw error;
  }
}

/**
 * Get effective church ID for queries
 * Returns admin church context if set, otherwise attempts to get user's church
 */
export async function getEffectiveChurchId(
  userId: string,
  userRole: string
): Promise<string | null> {
  // Check if system admin has church context set
  if (isSystemAdmin(userRole)) {
    const context = await getAdminChurchContext(userRole);
    if (context) {
      return context.churchId;
    }
    // System admin without context - return null (no church restriction)
    return null;
  }

  // Regular users - find their church through various relationships
  try {
    // Try to find user's church through campus
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        campusId: true,
        campus: {
          select: {
            churchId: true,
          },
        },
      },
    });

    if (user?.campus?.churchId) {
      return user.campus.churchId;
    }

    // Try through group memberships -> campus -> church
    const groupMembership = await prisma.groupMember.findFirst({
      where: { userId },
      select: {
        group: {
          select: {
            campusId: true,
            campus: {
              select: {
                churchId: true,
              },
            },
          },
        },
      },
    });

    if (groupMembership?.group?.campus?.churchId) {
      return groupMembership.group.campus.churchId;
    }

    // No church found
    return null;
  } catch (error) {
    console.error("Error getting effective church ID:", error);
    return null;
  }
}
