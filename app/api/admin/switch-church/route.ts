/**
 * System Admin Church Switcher API
 * Allows SUPERADMIN, SYSTEM_ADMIN, and SYSTEM_SUPPORT to switch church context
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isSystemAdmin,
  getAdminChurchContext,
  setAdminChurchContext,
  clearAdminChurchContext,
} from "@/lib/admin-church-context";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    
    // Only system admins can use this feature
    if (!isSystemAdmin(userRole)) {
      return NextResponse.json(
        { error: "Access denied. System admin role required." },
        { status: 403 }
      );
    }

    // Get current context
    const currentContext = await getAdminChurchContext(userRole);

    // Fetch all churches
    const churches = await prisma.church.findMany({
      select: {
        id: true,
        name: true,
        logo: true,
        address: true,
        city: true,
        state: true,
        country: true,
        isActive: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
        campuses: {
          select: {
            _count: {
              select: {
                users: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      currentContext,
      churches: churches.map((church) => {
        // Calculate total users across all campuses
        const totalUsers = church.campuses.reduce(
          (sum, campus) => sum + campus._count.users,
          0
        );
        
        return {
          id: church.id,
          name: church.name,
          logo: church.logo,
          location: [church.city, church.state, church.country]
            .filter(Boolean)
            .join(", "),
          isActive: church.isActive,
          plan: church.subscription?.plan || "FREE",
          status: church.subscription?.status || "ACTIVE",
          memberCount: totalUsers,
          createdAt: church.createdAt,
        };
      }),
    });
  } catch (error: any) {
    console.error("Error fetching churches:", error);
    return NextResponse.json(
      { error: "Failed to fetch churches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    
    // Only system admins can use this feature
    if (!isSystemAdmin(userRole)) {
      return NextResponse.json(
        { error: "Access denied. System admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { churchId } = body;

    if (!churchId) {
      return NextResponse.json(
        { error: "Church ID is required" },
        { status: 400 }
      );
    }

    // Set church context
    const context = await setAdminChurchContext(churchId, userRole, userId);

    if (!context) {
      return NextResponse.json(
        { error: "Failed to set church context" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      context,
      message: `Switched to ${context.churchName}`,
    });
  } catch (error: any) {
    console.error("Error switching church:", error);
    return NextResponse.json(
      { error: error.message || "Failed to switch church" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    
    // Only system admins can use this feature
    if (!isSystemAdmin(userRole)) {
      return NextResponse.json(
        { error: "Access denied. System admin role required." },
        { status: 403 }
      );
    }

    // Clear church context (return to system admin view)
    await clearAdminChurchContext();

    return NextResponse.json({
      success: true,
      message: "Returned to system admin view",
    });
  } catch (error: any) {
    console.error("Error clearing church context:", error);
    return NextResponse.json(
      { error: "Failed to clear church context" },
      { status: 500 }
    );
  }
}
