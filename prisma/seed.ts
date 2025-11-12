import { PrismaClient } from "../lib/generated/prisma/client";
import { config } from "dotenv";
import { createCognitoUser } from "../lib/cognito";

// Load environment variables
config();

const prisma = new PrismaClient();

// Helper function to create user in both Cognito and database
async function createUserWithCognito(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string,
  role: "ADMIN" | "PASTOR" | "LEADER" | "MEMBER" | "GUEST" = "GUEST",
  canLogin: boolean = false
) {
  // Create user in Cognito first (if AWS credentials are configured)
  let cognitoCreated = false;
  const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && 
                            process.env.AWS_ACCESS_KEY_ID !== "your-access-key" &&
                            process.env.AWS_SECRET_ACCESS_KEY &&
                            process.env.AWS_SECRET_ACCESS_KEY !== "your-secret-key";

  if (!hasAwsCredentials) {
    console.log(`⚠️  AWS credentials not configured. Skipping Cognito registration for ${email}`);
    console.log("   User will be created in database only. Configure AWS credentials to enable Cognito registration.");
  } else {
    try {
      await createCognitoUser(
        email,
        password,
        firstName,
        lastName,
        phone
      );
      console.log(`✅ User created in Cognito: ${email}`);
      cognitoCreated = true;
    } catch (error: any) {
      // If user already exists in Cognito, continue
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("UsernameExistsException") ||
        error.name === "UsernameExistsException"
      ) {
        console.log(`ℹ️  User already exists in Cognito: ${email}`);
        cognitoCreated = true; // Consider it successful if already exists
      } else if (
        error.name === "UnrecognizedClientException" ||
        error.message?.includes("security token") ||
        error.message?.includes("invalid")
      ) {
        console.error(`⚠️  AWS credentials invalid. Skipping Cognito registration for ${email}`);
        console.log("   User will be created in database only. Please check your AWS credentials.");
      } else {
        console.error(`⚠️  Error creating Cognito user (${email}):`, error.message);
        console.log("   Continuing with database user creation...");
      }
    }
  }

  // Check if user already exists in database
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`ℹ️  User already exists in database: ${email}`);
    console.log(`   Current role: ${existingUser.role}, Current canLogin: ${existingUser.canLogin}`);
    // Update user to ensure proper settings
    // For ADMIN role, always enable canLogin
    // For other roles, use the canLogin parameter
    const shouldEnableLogin = role === "ADMIN" || canLogin;
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role,
        status: "ACTIVE",
        canLogin: shouldEnableLogin,
        emailVerified: true,
        phoneVerified: phone ? true : undefined,
      },
    });
    console.log(`   ✅ Updated: role=${updated.role}, canLogin=${updated.canLogin}, status=${updated.status}`);
    return updated;
  }

  // Create user in database
  // For ADMIN role, always enable canLogin
  // For other roles, use the canLogin parameter
  const shouldEnableLogin = role === "ADMIN" || canLogin;
  const user = await prisma.user.create({
    data: {
      email,
      phone: phone || null,
      firstName,
      lastName,
      role,
      status: "ACTIVE",
      canLogin: shouldEnableLogin,
      emailVerified: true,
      phoneVerified: phone ? true : false,
    },
  });

  console.log(`✅ User created in database: ${email}`);
  return user;
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // Define users to seed
  const usersToSeed = [
    {
      email: "mrhoseah@gmail.com",
      password: "@@H5210h1...",
      firstName: "Hoseah",
      lastName: "Kiplang'at",
      phone: "+254715070203",
      role: "ADMIN" as const,
      canLogin: true,
    },
    // Add more users here as needed
    // {
    //   email: "pastor@example.com",
    //   password: "SecurePassword123!",
    //   firstName: "John",
    //   lastName: "Pastor",
    //   phone: "+254700000000",
    //   role: "PASTOR" as const,
    //   canLogin: true,
    // },
  ];

  console.log(`📝 Creating ${usersToSeed.length} user(s)...\n`);

  for (const userData of usersToSeed) {
    try {
      const user = await createUserWithCognito(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.phone,
        userData.role,
        userData.canLogin
      );

      console.log(`   ✅ ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Can Login: ${user.canLogin}`);
      console.log(`      Password: ${userData.password}\n`);
    } catch (error: any) {
      console.error(`   ❌ Failed to create user ${userData.email}:`, error.message);
      console.log("");
    }
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

