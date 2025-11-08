import { config } from "dotenv";
import { resolve } from "path";
import { signInWithCognito } from "../lib/cognito";
import { prisma } from "../lib/prisma";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function testLogin() {
  const email = "mrhoseah@gmail.com";
  const password = process.argv[2] || "@@H5210h1...";

  console.log("🔍 Testing login for:", email);
  console.log("");

  try {
    // Step 1: Test Cognito authentication
    console.log("1️⃣ Testing Cognito authentication...");
    const cognitoResult = await signInWithCognito(email, password);
    console.log("✅ Cognito authentication successful!");
    console.log("   Access Token:", cognitoResult.accessToken?.substring(0, 20) + "...");
    console.log("");

    // Step 2: Check user in database
    console.log("2️⃣ Checking user in database...");
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
      },
    });

    if (!user) {
      console.log("❌ User not found in database!");
      return;
    }

    console.log("✅ User found in database:");
    console.log("   ID:", user.id);
    console.log("   Name:", `${user.firstName} ${user.lastName}`);
    console.log("   Role:", user.role);
    console.log("   Status:", user.status);
    console.log("   Can Login:", user.canLogin);
    console.log("   Email Verified:", user.emailVerified);
    console.log("");

    // Step 3: Check login eligibility
    console.log("3️⃣ Checking login eligibility...");
    const isAdmin = user.role === "ADMIN";
    const canLogin = isAdmin || (user.canLogin && user.status === "ACTIVE");

    if (canLogin) {
      console.log("✅ User CAN login!");
      if (isAdmin) {
        console.log("   Reason: User is ADMIN (always has access)");
      } else {
        console.log("   Reason: canLogin=true AND status=ACTIVE");
      }
    } else {
      console.log("❌ User CANNOT login!");
      if (!isAdmin && !user.canLogin) {
        console.log("   Reason: canLogin is false");
      }
      if (user.status !== "ACTIVE") {
        console.log("   Reason: Status is", user.status, "(must be ACTIVE)");
      }
    }
    console.log("");

    // Step 4: Check AWS credentials
    console.log("4️⃣ Checking AWS credentials...");
    const hasAwsKey = process.env.AWS_ACCESS_KEY_ID && 
                     process.env.AWS_ACCESS_KEY_ID !== "your-access-key";
    const hasAwsSecret = process.env.AWS_SECRET_ACCESS_KEY && 
                        process.env.AWS_SECRET_ACCESS_KEY !== "your-secret-key";
    
    if (hasAwsKey && hasAwsSecret) {
      console.log("✅ AWS credentials configured");
    } else {
      console.log("⚠️  AWS credentials not configured or using placeholders");
      console.log("   This will cause Cognito authentication to fail");
    }
    console.log("");

    // Step 5: Check NextAuth secret
    console.log("5️⃣ Checking NextAuth configuration...");
    const hasSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (hasSecret) {
      console.log("✅ NextAuth secret configured");
    } else {
      console.log("❌ NextAuth secret missing!");
    }
    console.log("");

    console.log("✅ All checks completed!");
    
  } catch (error: any) {
    console.error("❌ Error during login test:");
    console.error("   Message:", error.message);
    console.error("   Name:", error.name);
    console.error("   Code:", error.code);
    if (error.stack) {
      console.error("   Stack:", error.stack.split("\n")[0]);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

