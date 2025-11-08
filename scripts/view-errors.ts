import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ERROR_LOG_FILE = join(process.cwd(), "auth-errors.json");

function viewErrors() {
  console.log("📋 Viewing Authentication Errors\n");

  if (!existsSync(ERROR_LOG_FILE)) {
    console.log("No error log file found. Errors will be logged when they occur.");
    return;
  }

  try {
    const content = readFileSync(ERROR_LOG_FILE, "utf-8");
    const logs = JSON.parse(content);

    if (logs.length === 0) {
      console.log("✅ No errors logged yet.");
      return;
    }

    console.log(`Found ${logs.length} error(s):\n`);

    logs.forEach((log: any, index: number) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Error #${index + 1}`);
      console.log(`Time: ${log.timestamp}`);
      console.log(`Type: ${log.type}`);
      console.log(`Error Name: ${log.error.name || "N/A"}`);
      console.log(`Error Message: ${log.error.message}`);
      console.log(`Error Code: ${log.error.code || "N/A"}`);
      
      if (log.context) {
        console.log(`\nContext:`);
        console.log(JSON.stringify(log.context, null, 2));
      }
      
      if (log.error.stack) {
        console.log(`\nStack:`);
        console.log(log.error.stack);
      }
      
      console.log("");
    });

    console.log(`\n💡 To clear errors, run: npx tsx scripts/clear-errors.ts`);

  } catch (error: any) {
    console.error("❌ Error reading error log:", error.message);
  }
}

viewErrors();

