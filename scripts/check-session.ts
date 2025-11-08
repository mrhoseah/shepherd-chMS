import { config } from "dotenv";
import { resolve } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function checkSession() {
  console.log("🔍 Checking NextAuth session...");
  console.log("");

  try {
    // This won't work in a script context, but let's check the session structure
    console.log("📋 Session Configuration:");
    console.log("   NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET");
    console.log("   AUTH_SECRET:", process.env.AUTH_SECRET ? "SET" : "NOT SET");
    console.log("   NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "NOT SET");
    console.log("");

    console.log("⚠️  Note: Session checking requires a running Next.js server.");
    console.log("   To check your session:");
    console.log("   1. Make sure you're logged in (cookies are set)");
    console.log("   2. Check browser DevTools → Application → Cookies");
    console.log("   3. Look for 'next-auth.session-token' cookie");
    console.log("   4. Check server console when accessing /dashboard");
    console.log("");

    console.log("🔍 Common Issues:");
    console.log("   1. Session token not being set");
    console.log("   2. NEXTAUTH_SECRET not configured");
    console.log("   3. Session decryption failing");
    console.log("   4. User ID not in session");
    console.log("");

    console.log("🔧 To Debug:");
    console.log("   1. Check browser cookies - is 'next-auth.session-token' present?");
    console.log("   2. Check server console when accessing /dashboard");
    console.log("   3. Look for 'User ID not found' or 'Unauthorized' errors");
    console.log("   4. Verify NEXTAUTH_SECRET is set in .env");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

checkSession();

