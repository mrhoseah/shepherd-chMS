import { config } from "dotenv";
import { resolve } from "path";
import { createCognitoUser } from "../lib/cognito";
import { prisma } from "../lib/prisma";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function registerFirstUser() {
  console.log("👤 Register First User to Cognito\n");

  // Get user details from command line arguments or use defaults
  const args = process.argv.slice(2);
  const email = args[0] || process.env.FIRST_USER_EMAIL || "mrhoseah@gmail.com";
  const password = args[1] || process.env.FIRST_USER_PASSWORD || "@@H5210h1...";
  const firstName = args[2] || "Admin";
  const lastName = args[3] || "User";
  const phone = args[4] || undefined;

  console.log("📋 Configuration:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password.length > 0 ? "***" : "NOT SET"}`);
  console.log(`   Name: ${firstName} ${lastName}`);
  console.log(`   Phone: ${phone || "Not provided"}`);
  console.log("");

  // Check AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ Error: AWS credentials not configured");
    console.error("   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file");
    process.exit(1);
  }

  // Check Cognito configuration
  if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
    console.error("❌ Error: Cognito configuration missing");
    console.error("   Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in .env file");
    process.exit(1);
  }

  console.log("✅ Environment check passed");
  console.log("");

  try {
    // Step 1: Create user in Cognito
    console.log("1️⃣ Creating user in Cognito...");
    await createCognitoUser(email, password, firstName, lastName, phone);
    console.log("   ✅ User created in Cognito");
    console.log("");

    // Step 2: Create user in database (optional)
    console.log("2️⃣ Creating user in database...");
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log("   ℹ️  User already exists in database");
        console.log("   Updating user...");
        
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firstName,
            lastName,
            phone: phone || null,
            role: "ADMIN",
            status: "ACTIVE",
            canLogin: true,
            emailVerified: true,
            phoneVerified: phone ? true : false,
          },
        });
        
        console.log("   ✅ User updated in database");
        console.log(`   User ID: ${updated.id}`);
      } else {
        const user = await prisma.user.create({
          data: {
            email,
            phone: phone || null,
            firstName,
            lastName,
            role: "ADMIN",
            status: "ACTIVE",
            canLogin: true,
            emailVerified: true,
            phoneVerified: phone ? true : false,
          },
        });
        
        console.log("   ✅ User created in database");
        console.log(`   User ID: ${user.id}`);
      }
    } catch (dbError: any) {
      console.error("   ⚠️  Database error:", dbError.message);
      console.log("   User is created in Cognito but not in database");
      console.log("   You can create the database user manually or use the API");
    }

    console.log("");
    console.log("🎉 Success! First user registered:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ADMIN`);
    console.log("");
    console.log("📝 Next steps:");
    console.log("   1. Enable USER_PASSWORD_AUTH flow in Cognito Console (if not already done)");
    console.log("   2. Try logging in with the credentials above");
    console.log("");

  } catch (error: any) {
    console.error("❌ Error registering user:");
    console.error("   Name:", error.name);
    console.error("   Message:", error.message);
    
    if (error.message?.includes("already exists") || error.name === "UsernameExistsException") {
      console.log("");
      console.log("ℹ️  User already exists in Cognito");
      console.log("   You can try logging in with these credentials");
    } else if (error.message?.includes("credentials") || error.message?.includes("AWS")) {
      console.log("");
      console.log("🔧 Fix: Check your AWS credentials in .env file");
    } else if (error.message?.includes("User pool") || error.message?.includes("not found")) {
      console.log("");
      console.log("🔧 Fix: Check your COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in .env file");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
registerFirstUser().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

