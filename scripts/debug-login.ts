import { config } from "dotenv";
import { resolve } from "path";
import { signInWithCognitoDirect as signInWithCognito } from "../lib/cognito-direct";
import { prisma } from "../lib/prisma";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function debugLogin() {
  const email = process.argv[2] || "mrhoseah@gmail.com";
  const password = process.argv[3] || "@@H5210h1...";

  console.log("🔍 Debugging login for:", email);
  console.log("");

  // Check environment variables
  console.log("📋 Environment Check:");
  console.log("   COGNITO_USER_POOL_ID:", process.env.COGNITO_USER_POOL_ID || "NOT SET");
  console.log("   COGNITO_CLIENT_ID:", process.env.COGNITO_CLIENT_ID || "NOT SET");
  console.log("   COGNITO_REGION:", process.env.COGNITO_REGION || "NOT SET");
  console.log("   AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "SET" : "NOT SET");
  console.log("   AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "NOT SET");
  console.log("   NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET");
  console.log("");

  try {
    // Test Cognito
    console.log("1️⃣ Testing Cognito authentication...");
    const cognitoResult = await signInWithCognito(email, password);
    console.log("✅ Cognito authentication successful!");
    console.log("");

    // Check database
    console.log("2️⃣ Checking database user...");
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
      },
    });

    if (!user) {
      console.log("❌ User not found in database!");
      return;
    }

    console.log("✅ User found:");
    console.log("   Role:", user.role);
    console.log("   Status:", user.status);
    console.log("   Can Login:", user.canLogin);
    console.log("");

    // Check eligibility
    console.log("3️⃣ Login Eligibility:");
    const isAdmin = user.role === "ADMIN";
    const canLogin = isAdmin || (user.canLogin && user.status === "ACTIVE");
    
    console.log("   Is Admin:", isAdmin);
    console.log("   Can Login:", canLogin);
    
    if (!canLogin) {
      console.log("   ❌ BLOCKED:");
      if (!isAdmin && !user.canLogin) {
        console.log("      - canLogin is false");
      }
      if (user.status !== "ACTIVE") {
        console.log("      - Status is", user.status, "(needs ACTIVE)");
      }
    } else {
      console.log("   ✅ User should be able to login!");
    }

  } catch (error: any) {
    console.error("❌ Error:");
    console.error("   Message:", error.message);
    console.error("   Name:", error.name);
    console.error("   Code:", error.code);
    
    if (error.message?.includes("does not exist")) {
      console.error("");
      console.error("🔧 FIX NEEDED:");
      console.error("   The Cognito Client ID in your .env file doesn't exist.");
      console.error("   Go to AWS Cognito Console and get the correct Client ID.");
      console.error("   Current Client ID:", process.env.COGNITO_CLIENT_ID);
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();

