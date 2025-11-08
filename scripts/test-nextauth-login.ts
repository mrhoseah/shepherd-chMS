import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function testNextAuthLogin() {
  console.log("🧪 Testing NextAuth Login Flow\n");

  const email = process.argv[2] || "mrhoseah@gmail.com";
  const password = process.argv[3] || "@@H5210h1...";

  console.log("📋 Test Configuration:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password.length > 0 ? "***" : "NOT SET"}`);
  console.log("");

  // Check if we have a base URL
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const signInUrl = `${baseUrl}/api/auth/signin/Cognito`;

  console.log(`🌐 Testing NextAuth endpoint: ${signInUrl}`);
  console.log("");

  try {
    // Create form data (NextAuth expects form-encoded data)
    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("redirect", "false");
    formData.append("json", "true");

    console.log("📤 Sending login request...");
    
    const response = await fetch(signInUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log("");

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Login successful!");
      console.log("   Response:", JSON.stringify(data, null, 2));
    } else {
      console.error("❌ Login failed!");
      console.error("   Error:", data.error || data.message || "Unknown error");
      console.error("   Full response:", JSON.stringify(data, null, 2));
    }

    // Also check cookies
    const cookies = response.headers.get("set-cookie");
    if (cookies) {
      console.log("");
      console.log("🍪 Cookies set:");
      cookies.split(",").forEach((cookie) => {
        console.log(`   ${cookie.trim()}`);
      });
    }

  } catch (error: any) {
    console.error("❌ Error testing login:");
    console.error("   Name:", error.name);
    console.error("   Message:", error.message);
    
    if (error.code === "ECONNREFUSED") {
      console.error("");
      console.error("🔧 Fix: Make sure your Next.js dev server is running:");
      console.error("   npm run dev");
    }
    
    process.exit(1);
  }
}

testNextAuthLogin().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

