import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

import { prisma } from "../lib/prisma";

async function setupUser() {
  const email = "mrhoseah@gmail.com";

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User ${email} not found in database. Creating...`);
      // User will be created on first login attempt, but we can create it now
      user = await prisma.user.create({
        data: {
          email,
          firstName: "Admin",
          lastName: "User",
          role: "ADMIN", // Make them admin so they can always login
          status: "ACTIVE",
          canLogin: true,
          emailVerified: true,
        },
      });
      console.log(`✅ User created: ${user.id}`);
    } else {
      console.log(`User ${email} found. Updating permissions...`);
      // Update user to ensure they can login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "ADMIN", // Make them admin
          status: "ACTIVE",
          canLogin: true,
          emailVerified: true,
        },
      });
      console.log(`✅ User updated: ${user.id}`);
    }

    console.log("\n📋 User Details:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Can Login: ${user.canLogin}`);
    console.log(`   Email Verified: ${user.emailVerified}`);

    console.log("\n✅ User is ready to login!");
    console.log("   You can now sign in at: http://localhost:3000/auth/signin");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code === "P2002") {
      console.error("   User with this email or phone already exists");
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupUser();

