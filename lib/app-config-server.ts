import { prisma } from "./prisma";

// Cache for server-side app name to avoid repeated DB queries
let cachedAppName: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get app name from database, environment variable, or default
 * Priority: Database (ChurchSetting) > Environment Variable > Default
 * This is a server-only function - do not import in client components
 */
export async function getAppNameFromDB(): Promise<string> {
  // Check cache first
  const now = Date.now();
  if (cachedAppName && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedAppName;
  }

  try {
    // Get the first active church
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: {
        settings: {
          where: { key: "APP_NAME" },
        },
      },
    });

    // Check if APP_NAME is set in ChurchSetting
    if (church?.settings && church.settings.length > 0) {
      const appNameSetting = church.settings[0];
      if (appNameSetting.value) {
        cachedAppName = appNameSetting.value;
        cacheTimestamp = now;
        return cachedAppName;
      }
    }

    // Fallback to environment variable
    const envAppName = process.env.APP_NAME || process.env.NEXT_PUBLIC_APP_NAME;
    if (envAppName) {
      cachedAppName = envAppName;
      cacheTimestamp = now;
      return cachedAppName;
    }

    // Default value
    cachedAppName = "East Gate Chapel";
    cacheTimestamp = now;
    return cachedAppName;
  } catch (error) {
    // If database query fails, fallback to env or default
    console.error("Error fetching app name from database:", error);
    const envAppName = process.env.APP_NAME || process.env.NEXT_PUBLIC_APP_NAME;
    return envAppName || "East Gate Chapel";
  }
}

/**
 * Clear the app name cache (useful after updating settings)
 */
export function clearAppNameCache() {
  cachedAppName = null;
  cacheTimestamp = 0;
}

