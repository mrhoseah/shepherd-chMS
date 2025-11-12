import { config } from "dotenv";
import { resolve } from "path";
import { prisma } from "../lib/prisma";
import { canUserLogin } from "../lib/casbin";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function checkAndFixUser() {
  const email = process.argv[2] || "mrhoseah@gmail.com";
  const enableLogin = process.argv.includes("--enable-login");

  console.log("🔍 Checking user:", email);
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
        createdAt: true,
      },
    });

    if (!user) {
      console.error("❌ User not found in database");
      console.log("\n💡 The user might need to be created first.");
      console.log("   They should exist in Cognito if they can authenticate.");
      process.exit(1);
    }

    console.log("✅ User found in database:");
    console.log("   ID:", user.id);
    console.log("   Name:", `${user.firstName} ${user.lastName}`);
    console.log("   Email:", user.email);
    console.log("   Role:", user.role);
    console.log("   Status:", user.status);
    console.log("   Can Login:", user.canLogin ? "✅ YES" : "❌ NO");
    console.log("   Email Verified:", user.emailVerified ? "✅" : "❌");
    console.log("   Phone Verified:", user.phoneVerified ? "✅" : "❌");
    console.log("   Created:", user.createdAt.toLocaleString());
    console.log("");

    // Check if user can login
    const canLogin = await canUserLogin(user.id);
    console.log("🔐 Login Status:", canLogin ? "✅ CAN LOGIN" : "❌ CANNOT LOGIN");
    console.log("");

    // Analyze why they can/can't login
    const isAdmin = user.role === "ADMIN";
    const restrictedRoles = ["PROTOCOL", "GUEST"];
    const isRestrictedRole = restrictedRoles.includes(user.role);

    console.log("📊 Permission Analysis:");
    console.log("   Is Admin:", isAdmin ? "✅ (Admins can always login)" : "❌");
    console.log("   Is Restricted Role:", isRestrictedRole ? "⚠️  (PROTOCOL/GUEST)" : "✅");
    console.log("   canLogin flag:", user.canLogin ? "✅" : "❌");
    console.log("   Status:", user.status === "ACTIVE" ? "✅ ACTIVE" : `❌ ${user.status}`);
    console.log("");

    if (canLogin) {
      console.log("✅ User can login! No action needed.");
      return;
    }

    // Show what needs to be fixed
    console.log("⚠️  Issues preventing login:");
    if (isRestrictedRole && !user.canLogin) {
      console.log("   - Restricted role (PROTOCOL/GUEST) without canLogin permission");
    }
    if (!user.canLogin) {
      console.log("   - canLogin is false");
    }
    if (user.status !== "ACTIVE") {
      console.log("   - Status is not ACTIVE");
    }
    console.log("");

    // Offer to fix
    if (enableLogin) {
      console.log("🔧 Enabling login access...");
      
      const updateData: any = {
        canLogin: true,
        status: "ACTIVE",
      };

      // If email/phone not verified, verify them
      if (!user.emailVerified) {
        updateData.emailVerified = true;
      }
      if (!user.phoneVerified && user.phoneVerified !== null) {
        updateData.phoneVerified = true;
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          canLogin: true,
        },
      });

      console.log("✅ User updated successfully!");
      console.log("   Status:", updated.status);
      console.log("   Can Login:", updated.canLogin ? "✅ YES" : "❌ NO");
      console.log("");
      console.log("🎉 User can now login!");
    } else {
      console.log("💡 To enable login, run:");
      console.log(`   npm run tsx scripts/check-and-fix-user.ts ${email} --enable-login`);
      console.log("");
      console.log("   Or manually update in the dashboard:");
      console.log(`   /dashboard/users/${user.id}`);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixUser();

