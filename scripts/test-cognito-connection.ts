import { config } from "dotenv";
import { resolve } from "path";
import { CognitoIdentityProviderClient, ListUsersCommand, DescribeUserPoolCommand } from "@aws-sdk/client-cognito-identity-provider";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function testCognitoConnection() {
  console.log("🔍 Testing AWS Cognito Connection...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log("   COGNITO_USER_POOL_ID:", process.env.COGNITO_USER_POOL_ID || "NOT SET");
  console.log("   COGNITO_CLIENT_ID:", process.env.COGNITO_CLIENT_ID || "NOT SET");
  console.log("   COGNITO_REGION:", process.env.COGNITO_REGION || "NOT SET");
  console.log("   AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "SET" : "NOT SET");
  console.log("   AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "NOT SET");
  console.log("");

  // Check for placeholder values
  const hasPlaceholderCredentials = 
    process.env.AWS_ACCESS_KEY_ID === "your-access-key" ||
    process.env.AWS_SECRET_ACCESS_KEY === "your-secret-key" ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY;

  if (hasPlaceholderCredentials) {
    console.error("❌ AWS credentials are not configured!");
    console.error("   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file");
    process.exit(1);
  }

  const region = process.env.COGNITO_REGION || "af-south-1";
  const userPoolId = process.env.COGNITO_USER_POOL_ID || "af-south-1_HZYIpahzs";

  try {
    // Create client
    console.log("1️⃣ Creating Cognito client...");
    const client = new CognitoIdentityProviderClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    console.log("✅ Client created successfully\n");

    // Test connection by describing user pool
    console.log("2️⃣ Testing connection to User Pool...");
    const describeCommand = new DescribeUserPoolCommand({
      UserPoolId: userPoolId,
    });

    const poolResponse = await client.send(describeCommand);
    console.log("✅ User Pool found:");
    console.log("   Name:", poolResponse.UserPool?.Name);
    console.log("   ID:", poolResponse.UserPool?.Id);
    console.log("   Status:", poolResponse.UserPool?.Status);
    console.log("");

    // Check app clients
    console.log("3️⃣ Checking App Clients...");
    const clientId = process.env.COGNITO_CLIENT_ID || "6qbvncedqjvi2jrpqhjj22ei7g";
    
    // List users to verify we can make API calls
    console.log("4️⃣ Testing API call (listing users)...");
    const listUsersCommand = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 1,
    });

    const usersResponse = await client.send(listUsersCommand);
    console.log("✅ API call successful");
    console.log("   Users in pool:", usersResponse.Users?.length || 0);
    console.log("");

    console.log("✅ All tests passed! AWS Cognito connection is working correctly.");
    console.log("\n📝 Next steps:");
    console.log("   1. Verify USER_PASSWORD_AUTH is enabled in your app client");
    console.log("   2. Check that your app client ID matches:", clientId);
    console.log("   3. Try logging in again");

  } catch (error: any) {
    console.error("\n❌ Error testing Cognito connection:");
    console.error("   Name:", error.name);
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    
    if (error.name === "ResourceNotFoundException") {
      console.error("\n🔧 Fix: User Pool or Client ID not found. Check your COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID");
    } else if (error.name === "UnrecognizedClientException" || 
               error.message?.includes("InvalidClientTokenId") ||
               error.message?.includes("SignatureDoesNotMatch")) {
      console.error("\n🔧 Fix: Invalid AWS credentials. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    } else if (error.name === "AccessDeniedException") {
      console.error("\n🔧 Fix: AWS credentials don't have permission to access Cognito. Check IAM permissions");
    } else {
      console.error("\n🔧 Fix: Check AWS credentials and Cognito configuration");
    }
    
    process.exit(1);
  }
}

testCognitoConnection();

