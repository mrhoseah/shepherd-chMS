import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

/**
 * This script helps debug NextAuth responses
 * It shows what NextAuth should return on successful/failed login
 */

console.log("📋 NextAuth Response Format Guide\n");

console.log("✅ SUCCESS Response:");
console.log(JSON.stringify({
  ok: true,
  error: null,
  status: 200,
  url: null,
}, null, 2));

console.log("\n❌ ERROR Response:");
console.log(JSON.stringify({
  ok: false,
  error: "Invalid email or password",
  status: 401,
  url: null,
}, null, 2));

console.log("\n⚠️  UNEXPECTED Response (no error, but not ok):");
console.log(JSON.stringify({
  ok: false,
  error: null,
  status: 200,
  url: "/api/auth/signin?error=CredentialsSignin",
}, null, 2));

console.log("\n💡 Common Issues:");
console.log("1. If result.ok is false but result.error is null:");
console.log("   - Check server logs for NextAuth errors");
console.log("   - Verify NEXTAUTH_SECRET is set");
console.log("   - Check if authorize() is returning null instead of user object");
console.log("");
console.log("2. If result.ok is true but session doesn't work:");
console.log("   - Check JWT callback is setting token data");
console.log("   - Verify session callback is setting session.user");
console.log("   - Check browser cookies for NextAuth session");
console.log("");
console.log("3. If redirect happens but user isn't logged in:");
console.log("   - Session might not be created properly");
console.log("   - Check if cookies are being set");
console.log("   - Verify NEXTAUTH_URL matches your app URL");

