import { config } from "dotenv";
import { resolve } from "path";
import { prisma } from "../lib/prisma";
import { canUserLogin } from "../lib/casbin";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function checkUserPermissions() {
  const email = process.argv[2] || "mrhoseah@gmail.com";

  console.log("🔍 Checking user permissions for:", email);
  console.log("");

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        canLogin: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      console.error("❌ User not found in database");
      process.exit(1);
    }

    console.log("📋 User Details:");
    console.log("   ID:", user.id);
    console.log("   Email:", user.email);
    console.log("   Name:", `${user.firstName} ${user.lastName}`);
    console.log("   Role:", user.role);
    console.log("   Status:", user.status);
    console.log("   canLogin:", user.canLogin);
    console.log("   Email Verified:", user.emailVerified);
    console.log("   Phone Verified:", user.phoneVerified);
    console.log("");

    // Check if user can login
    console.log("🔐 Checking login permissions...");
    const canLogin = await canUserLogin(user.id);
    console.log("   canUserLogin() result:", canLogin);
    console.log("");

    // Determine why they can/can't login
    const isAdmin = user.role === "ADMIN";
    const hasCanLogin = user.canLogin;
    const isActive = user.status === "ACTIVE";

    console.log("📊 Permission Analysis:");
    console.log("   Is Admin:", isAdmin, isAdmin ? "✅ (Admins can always login)" : "");
    console.log("   canLogin flag:", hasCanLogin, hasCanLogin ? "✅" : "❌");
    console.log("   Status:", isActive ? "✅ ACTIVE" : `❌ ${user.status}`);
    console.log("");

    if (canLogin) {
      console.log("✅ User CAN access dashboard");
      if (isAdmin) {
        console.log("   Reason: User is ADMIN (always has access)");
      } else {
        console.log("   Reason: canLogin=true AND status=ACTIVE");
      }
    } else {
      console.log("❌ User CANNOT access dashboard");
      console.log("   Reasons:");
      if (!isAdmin && !hasCanLogin) {
        console.log("      - canLogin is false");
      }
      if (!isActive) {
        console.log("      - Status is", user.status, "(must be ACTIVE)");
      }
      console.log("");
      console.log("🔧 To fix:");
      if (!hasCanLogin) {
        console.log("   1. Set canLogin to true:");
        console.log(`      UPDATE "User" SET "canLogin" = true WHERE email = '${email}';`);
      }
      if (!isActive) {
        console.log("   2. Set status to ACTIVE:");
        console.log(`      UPDATE "User" SET status = 'ACTIVE' WHERE email = '${email}';`);
      }
      if (user.role !== "ADMIN") {
        console.log("   3. Or make user ADMIN:");
        console.log(`      UPDATE "User" SET role = 'ADMIN' WHERE email = '${email}';`);
      }
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions();

