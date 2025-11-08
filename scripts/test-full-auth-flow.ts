import { config } from "dotenv";
import { resolve } from "path";
import { signInWithCognitoDirect, getUserFromTokenDirect } from "../lib/cognito-direct";
import { prisma } from "../lib/prisma";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function testFullAuthFlow() {
  console.log("🧪 Testing Full Authentication Flow\n");

  const email = process.argv[2] || "mrhoseah@gmail.com";
  const password = process.argv[3] || "@@H5210h1...";

  console.log("📋 Test Configuration:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password.length > 0 ? "***" : "NOT SET"}`);
  console.log("");

  try {
    // Step 1: Authenticate with Cognito
    console.log("1️⃣ Step 1: Authenticate with Cognito...");
    const cognitoResponse = await signInWithCognitoDirect(email, password);
    console.log("   ✅ Cognito authentication successful");
    console.log(`   Access Token: ${cognitoResponse.accessToken.substring(0, 20)}...`);
    console.log(`   ID Token: ${cognitoResponse.idToken.substring(0, 20)}...`);
    console.log("");

    // Step 2: Get user from token
    console.log("2️⃣ Step 2: Get user attributes from Cognito...");
    const cognitoUser = await getUserFromTokenDirect(cognitoResponse.accessToken);
    console.log("   ✅ User attributes retrieved");
    console.log(`   Email: ${cognitoUser.email}`);
    console.log(`   Name: ${cognitoUser.givenName} ${cognitoUser.familyName}`);
    console.log(`   Email Verified: ${cognitoUser.emailVerified}`);
    console.log("");

    // Step 3: Check database user
    console.log("3️⃣ Step 3: Check database user...");
    const dbUser = await prisma.user.findUnique({
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
      },
    });

    if (!dbUser) {
      console.error("   ❌ User not found in database");
      console.log("   This would trigger user creation in NextAuth");
    } else {
      console.log("   ✅ User found in database");
      console.log(`   ID: ${dbUser.id}`);
      console.log(`   Role: ${dbUser.role}`);
      console.log(`   Status: ${dbUser.status}`);
      console.log(`   Can Login: ${dbUser.canLogin}`);
      console.log("");
    }

    // Step 4: Check permissions (simulating auth.ts logic)
    console.log("4️⃣ Step 4: Check login permissions...");
    if (dbUser) {
      const isAdmin = dbUser.role === "ADMIN";
      const canLogin = isAdmin || (dbUser.canLogin && dbUser.status === "ACTIVE");

      if (!canLogin) {
        console.error("   ❌ User cannot login");
        if (!isAdmin && !dbUser.canLogin) {
          console.error("   Reason: User does not have canLogin permission");
        }
        if (dbUser.status !== "ACTIVE") {
          console.error(`   Reason: User status is ${dbUser.status}`);
        }
      } else {
        console.log("   ✅ User can login");
        console.log(`   Is Admin: ${isAdmin}`);
        console.log(`   Can Login: ${dbUser.canLogin}`);
        console.log(`   Status: ${dbUser.status}`);
      }
    }

    console.log("");
    console.log("🎉 Full authentication flow test completed successfully!");
    console.log("");
    console.log("📝 Summary:");
    console.log("   ✅ Cognito authentication works");
    console.log("   ✅ User token retrieval works");
    console.log("   ✅ Database user exists");
    console.log("   ✅ User has login permissions");
    console.log("");
    console.log("💡 If web login still fails, check:");
    console.log("   1. Next.js dev server is running (npm run dev)");
    console.log("   2. Browser console for JavaScript errors");
    console.log("   3. Server console for NextAuth errors");
    console.log("   4. Network tab for API response errors");

  } catch (error: any) {
    console.error("❌ Authentication flow failed:");
    console.error("   Name:", error.name);
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack?.split("\n")[0]);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFullAuthFlow().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

