import { config } from "dotenv";
import { resolve } from "path";
import { signInWithCognitoDirect } from "../lib/cognito-direct";

config({ path: resolve(__dirname, "../.env") });

async function checkActualError() {
  const email = process.argv[2] || "mrhoseah@gmail.com";
  const password = process.argv[3] || "@@H5210h1...";

  console.log("🔍 Testing actual Cognito error...\n");
  console.log(`Email: ${email}`);
  console.log(`Password: ${"*".repeat(password.length)}\n`);

  console.log("📋 Configuration:");
  console.log(`   COGNITO_USER_POOL_ID: ${process.env.COGNITO_USER_POOL_ID}`);
  console.log(`   COGNITO_CLIENT_ID: ${process.env.COGNITO_CLIENT_ID}`);
  console.log(`   COGNITO_REGION: ${process.env.COGNITO_REGION}`);
  console.log(`   COGNITO_CLIENT_SECRET: ${process.env.COGNITO_CLIENT_SECRET ? "SET" : "NOT SET"}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? "SET (not needed for auth)" : "NOT SET (not needed for auth)"}`);
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? "SET (not needed for auth)" : "NOT SET (not needed for auth)"}`);
  console.log("");

  try {
    console.log("🌐 Attempting direct HTTP authentication (no AWS credentials needed)...\n");
    const result = await signInWithCognitoDirect(email, password);
    console.log("✅ Authentication successful!");
    console.log(`   Access Token: ${result.accessToken.substring(0, 20)}...`);
  } catch (error: any) {
    console.error("❌ Authentication failed:");
    console.error("   Error Name:", error.name);
    console.error("   Error Message:", error.message);
    console.error("   Error Code:", error.code);
    console.error("");
    
    console.error("📝 Analysis:");
    if (error.message?.includes("AWS") || error.message?.includes("credentials")) {
      console.error("   ⚠️  Error mentions AWS/credentials, but direct HTTP calls don't need them!");
      console.error("   This is likely a Cognito configuration issue, not an AWS credentials issue.");
      console.error("");
      console.error("   Possible causes:");
      console.error("   1. COGNITO_CLIENT_ID is incorrect");
      console.error("   2. COGNITO_USER_POOL_ID is incorrect");
      console.error("   3. COGNITO_CLIENT_SECRET is incorrect (if your client requires it)");
      console.error("   4. USER_PASSWORD_AUTH flow is not enabled");
    } else if (error.message?.includes("flow not enabled")) {
      console.error("   ✅ This is the actual issue: Authentication flow not enabled");
      console.error("   Fix: Enable ALLOW_USER_PASSWORD_AUTH in AWS Cognito Console");
    } else if (error.message?.includes("Invalid email or password")) {
      console.error("   ✅ This is the actual issue: Wrong credentials");
    } else if (error.message?.includes("UnrecognizedClientException")) {
      console.error("   ✅ This is the actual issue: Invalid Cognito Client ID");
      console.error("   Fix: Check your COGNITO_CLIENT_ID in .env file");
    } else {
      console.error("   ✅ This is the actual error from Cognito");
    }
    
    console.error("");
    console.error("💡 Check auth-errors.json for full error details:");
    console.error("   npx tsx scripts/view-errors.ts");
  }
}

checkActualError();

