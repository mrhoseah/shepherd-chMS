import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const ERROR_LOG_FILE = join(process.cwd(), "auth-errors.json");

interface ErrorLog {
  timestamp: string;
  type: string;
  error: {
    name?: string;
    message: string;
    code?: string;
    stack?: string;
  };
  context?: Record<string, any>;
}

export function logError(
  type: string,
  error: any,
  context?: Record<string, any>
) {
  try {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      error: {
        name: error?.name,
        message: error?.message || String(error),
        code: error?.code,
        stack: error?.stack?.split("\n").slice(0, 5).join("\n"),
      },
      context,
    };

    // Read existing logs
    let logs: ErrorLog[] = [];
    if (existsSync(ERROR_LOG_FILE)) {
      try {
        const content = readFileSync(ERROR_LOG_FILE, "utf-8");
        logs = JSON.parse(content);
      } catch (e) {
        // If file is corrupted, start fresh
        logs = [];
      }
    }

    // Add new log
    logs.push(errorLog);

    // Keep only last 50 errors
    if (logs.length > 50) {
      logs = logs.slice(-50);
    }

    // Write back to file
    writeFileSync(ERROR_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");

    console.error(`📝 Error logged to ${ERROR_LOG_FILE}`);
  } catch (writeError) {
    console.error("Failed to write error log:", writeError);
  }
}

export function getErrorLogs(): ErrorLog[] {
  try {
    if (existsSync(ERROR_LOG_FILE)) {
      const content = readFileSync(ERROR_LOG_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Failed to read error logs:", e);
  }
  return [];
}

export function clearErrorLogs() {
  try {
    if (existsSync(ERROR_LOG_FILE)) {
      writeFileSync(ERROR_LOG_FILE, "[]", "utf-8");
      console.log("✅ Error logs cleared");
    }
  } catch (e) {
    console.error("Failed to clear error logs:", e);
  }
}

