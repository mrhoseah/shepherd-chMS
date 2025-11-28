import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { canUserLogin, checkPermission } from "./casbin";
import { getEffectiveChurchId } from "./admin-church-context";

// Middleware to check if user can access dashboard
export async function requireLogin() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error("❌ requireLogin: No session found");
      return { authorized: false, error: "Unauthorized - No session" };
    }

    console.log("🔍 requireLogin: Session found");
    console.log("   Session user:", {
      email: session.user?.email,
      name: session.user?.name,
      id: (session.user as any)?.id,
      role: (session.user as any)?.role,
    });

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    
    if (!userId) {
      console.error("❌ requireLogin: User ID not found in session");
      console.error("   Session user object:", session.user);
      return { authorized: false, error: "User ID not found in session" };
    }

    console.log("🔍 requireLogin: Checking canUserLogin for userId:", userId);
    const canLogin = await canUserLogin(userId);
    console.log("   canUserLogin result:", canLogin);
    
    if (!canLogin) {
      console.error("❌ requireLogin: User cannot login");
      return {
        authorized: false,
        error: "You do not have permission to access the dashboard",
      };
    }

    // Get effective church ID (includes admin context if set)
    const effectiveChurchId = await getEffectiveChurchId(userId, userRole);

    console.log("✅ requireLogin: User authorized");
    return { 
      authorized: true, 
      userId, 
      session,
      churchId: effectiveChurchId,
      userRole,
    };
  } catch (error: any) {
    console.error("❌ requireLogin: Error checking login:", error);
    console.error("   Error message:", error.message);
    console.error("   Error stack:", error.stack);
    return { authorized: false, error: `Error checking permissions: ${error.message}` };
  }
}

// Middleware to check specific permission
export async function requirePermission(resource: string, action: string) {
  const loginCheck = await requireLogin();
  if (!loginCheck.authorized) {
    return loginCheck;
  }

  const userId = loginCheck.userId!;
  const hasPermission = await checkPermission(userId, resource, action);

  if (!hasPermission) {
    return {
      authorized: false,
      error: `You do not have permission to ${action} ${resource}`,
    };
  }

  return { authorized: true, userId, session: loginCheck.session };
}

// Check if user is admin
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { authorized: false, error: "Unauthorized" };
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return { authorized: false, error: "Admin access required" };
  }

  return { authorized: true, userId: (session.user as any).id, session };
}

// Get current user from session
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).id) {
    return null;
  }
  return {
    id: (session.user as any).id,
    email: session.user?.email,
    role: (session.user as any).role,
  };
}

