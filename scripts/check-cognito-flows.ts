import { config } from "dotenv";
import { resolve } from "path";
import { CognitoIdentityProviderClient, DescribeUserPoolClientCommand } from "@aws-sdk/client-cognito-identity-provider";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function checkCognitoFlows() {
  console.log("🔍 Checking Cognito App Client Configuration\n");

  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const region = process.env.COGNITO_REGION || "af-south-1";

  if (!userPoolId || !clientId) {
    console.error("❌ Missing configuration:");
    console.error("   COGNITO_USER_POOL_ID:", userPoolId || "NOT SET");
    console.error("   COGNITO_CLIENT_ID:", clientId || "NOT SET");
    process.exit(1);
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ AWS credentials not configured");
    console.error("   This script needs AWS credentials to check app client configuration");
    process.exit(1);
  }

  console.log("📋 Configuration:");
  console.log(`   User Pool ID: ${userPoolId}`);
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Region: ${region}`);
  console.log("");

  try {
    const client = new CognitoIdentityProviderClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    console.log("🔍 Fetching app client details from AWS...\n");

    const command = new DescribeUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
    });

    const response = await client.send(command);
    const clientData = response.UserPoolClient;

    if (!clientData) {
      console.error("❌ App client not found");
      process.exit(1);
    }

    console.log("✅ App Client Found:");
    console.log(`   Client Name: ${clientData.ClientName || "N/A"}`);
    console.log(`   Client ID: ${clientData.ClientId}`);
    console.log("");

    // Check authentication flows
    const explicitAuthFlows = clientData.ExplicitAuthFlows || [];
    
    console.log("🔐 Authentication Flows Configuration:");
    console.log("");

    const requiredFlow = "ALLOW_USER_PASSWORD_AUTH";
    const hasUserPasswordAuth = explicitAuthFlows.includes(requiredFlow);
    
    const flows = [
      { name: "ALLOW_USER_SRP_AUTH", enabled: explicitAuthFlows.includes("ALLOW_USER_SRP_AUTH") },
      { name: "ALLOW_REFRESH_TOKEN_AUTH", enabled: explicitAuthFlows.includes("ALLOW_REFRESH_TOKEN_AUTH") },
      { name: "ALLOW_USER_PASSWORD_AUTH", enabled: hasUserPasswordAuth, required: true },
      { name: "ALLOW_ADMIN_USER_PASSWORD_AUTH", enabled: explicitAuthFlows.includes("ALLOW_ADMIN_USER_PASSWORD_AUTH") },
      { name: "ALLOW_CUSTOM_AUTH", enabled: explicitAuthFlows.includes("ALLOW_CUSTOM_AUTH") },
    ];

    for (const flow of flows) {
      const status = flow.enabled ? "✅ ENABLED" : "❌ DISABLED";
      const required = flow.required ? " (REQUIRED)" : "";
      console.log(`   ${status} - ${flow.name}${required}`);
    }

    console.log("");

    if (!hasUserPasswordAuth) {
      console.error("❌ PROBLEM FOUND:");
      console.error(`   ${requiredFlow} is NOT enabled`);
      console.error("");
      console.error("🔧 SOLUTION:");
      console.error("   1. Go to: https://console.aws.amazon.com/cognito/");
      console.error(`   2. Select region: ${region}`);
      console.error(`   3. Click on User Pool: ${userPoolId}`);
      console.error("   4. Go to 'App integration' tab");
      console.error("   5. Under 'App clients and analytics', click on your app client");
      console.error(`   6. Click 'Edit' button`);
      console.error("   7. Under 'Authentication flows configuration', check:");
      console.error(`      ✅ ALLOW_USER_PASSWORD_AUTH`);
      console.error("   8. Click 'Save changes'");
      console.error("   9. Wait 1-2 minutes and try logging in again");
      console.error("");
      process.exit(1);
    } else {
      console.log("✅ All required authentication flows are enabled!");
      console.log("");
      console.log("💡 If login still fails, check:");
      console.log("   - User exists in Cognito");
      console.log("   - Password is correct");
      console.log("   - User status is CONFIRMED");
      console.log("");
    }

  } catch (error: any) {
    console.error("❌ Error checking Cognito configuration:");
    console.error("   Name:", error.name);
    console.error("   Message:", error.message);
    
    if (error.name === "ResourceNotFoundException") {
      console.error("");
      console.error("🔧 Fix: Check your COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID");
      console.error("   They might be incorrect or the resources don't exist");
    } else if (error.message?.includes("credentials") || error.message?.includes("security token")) {
      console.error("");
      console.error("🔧 Fix: Check your AWS credentials in .env file");
    }
    
    process.exit(1);
  }
}

checkCognitoFlows().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

