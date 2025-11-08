import { config } from "dotenv";
import { resolve } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function testSession() {
  console.log("🧪 Testing NextAuth Session\n");

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("❌ No session found");
      console.log("\n💡 This means:");
      console.log("   1. User is not logged in");
      console.log("   2. Session cookie is not set");
      console.log("   3. Session expired or invalid");
      return;
    }

    console.log("✅ Session found:");
    console.log(JSON.stringify(session, null, 2));
    console.log("\n📋 Session Details:");
    console.log(`   User ID: ${(session.user as any)?.id || "NOT SET"}`);
    console.log(`   Email: ${session.user?.email || "NOT SET"}`);
    console.log(`   Name: ${session.user?.name || "NOT SET"}`);
    console.log(`   Role: ${(session.user as any)?.role || "NOT SET"}`);
    console.log(`   Has Access Token: ${!!(session as any).accessToken}`);
    console.log(`   Has ID Token: ${!!(session as any).idToken}`);

  } catch (error: any) {
    console.error("❌ Error getting session:");
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack?.split("\n")[0]);
  }
}

testSession().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

