// Default app configuration from environment variables
// This file is safe for client-side usage - no Prisma imports
const defaultAppConfig = {
  name: process.env.APP_NAME || process.env.NEXT_PUBLIC_APP_NAME || "East Gate Chapel",
  shortName: process.env.APP_SHORT_NAME || process.env.NEXT_PUBLIC_APP_SHORT_NAME || "ChMS",
  description: process.env.APP_DESCRIPTION || process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Church Management System",
  tagline: process.env.APP_TAGLINE || process.env.NEXT_PUBLIC_APP_TAGLINE || "Church Management",
};

// Synchronous config for client-side usage (uses env vars only)
export const appConfig = {
  name: defaultAppConfig.name,
  shortName: defaultAppConfig.shortName,
  description: defaultAppConfig.description,
  tagline: defaultAppConfig.tagline,
};

// For client-side usage (synchronous, uses env vars only)
export function getAppName() {
  if (typeof window === "undefined") {
    return appConfig.name;
  }
  return appConfig.name;
}

export function getAppShortName() {
  if (typeof window === "undefined") {
    return appConfig.shortName;
  }
  return appConfig.shortName;
}

export function getAppDescription() {
  if (typeof window === "undefined") {
    return appConfig.description;
  }
  return appConfig.description;
}

export function getAppTagline() {
  if (typeof window === "undefined") {
    return appConfig.tagline;
  }
  return appConfig.tagline;
}

