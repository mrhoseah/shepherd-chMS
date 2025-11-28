import { prisma } from "./prisma";
import { PremiumFeature, SubscriptionPlan } from "@/lib/generated/prisma/enums";

/**
 * Check if a church has access to a specific premium feature
 */
export async function hasFeatureAccess(
  churchId: string,
  feature: PremiumFeature
): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { churchId },
    select: {
      plan: true,
      features: true,
      status: true,
    },
  });

  // No subscription means free plan
  if (!subscription) {
    return false;
  }

  // Check if subscription is active
  if (subscription.status !== "ACTIVE" && subscription.status !== "TRIAL") {
    return false;
  }

  // Check if feature is explicitly enabled
  if (subscription.features.includes(feature)) {
    return true;
  }

  // Check plan-based defaults
  return isPlanFeatureIncluded(subscription.plan, feature);
}

/**
 * Get all premium features for a church
 */
export async function getChurchFeatures(churchId: string): Promise<{
  plan: SubscriptionPlan;
  features: PremiumFeature[];
  hasAISeatingGenerator: boolean;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { churchId },
    select: {
      plan: true,
      features: true,
      status: true,
    },
  });

  if (!subscription || subscription.status === "CANCELLED" || subscription.status === "EXPIRED") {
    return {
      plan: "FREE",
      features: [],
      hasAISeatingGenerator: false,
    };
  }

  const allFeatures = new Set(subscription.features);

  // Add plan-based features
  const planFeatures = getPlanFeatures(subscription.plan);
  planFeatures.forEach((f) => allFeatures.add(f));

  const featuresArray = Array.from(allFeatures);

  return {
    plan: subscription.plan,
    features: featuresArray,
    hasAISeatingGenerator: featuresArray.includes("AI_SEATING_GENERATOR"),
  };
}

/**
 * Check if a feature is included in a specific plan by default
 */
function isPlanFeatureIncluded(
  plan: SubscriptionPlan,
  feature: PremiumFeature
): boolean {
  const planFeatures = getPlanFeatures(plan);
  return planFeatures.includes(feature);
}

/**
 * Get default features for each plan
 */
function getPlanFeatures(plan: SubscriptionPlan): PremiumFeature[] {
  switch (plan) {
    case "FREE":
      return [];

    case "BASIC":
      return [
        "ADVANCED_REPORTING",
        "BULK_OPERATIONS",
        "CUSTOM_FORMS",
        "MEMBER_DIRECTORY_PRO",
      ];

    case "PREMIUM":
      return [
        "ADVANCED_REPORTING",
        "BULK_OPERATIONS",
        "CUSTOM_FORMS",
        "MEMBER_DIRECTORY_PRO",
        "BIOMETRIC_ATTENDANCE",
        "CUSTOM_BRANDING",
        "ADVANCED_ANALYTICS",
        "SMS_MESSAGING",
        "ADVANCED_SCHEDULING",
        "DATA_EXPORT_IMPORT",
      ];

    case "ENTERPRISE":
      return [
        "BIOMETRIC_ATTENDANCE",
        "ADVANCED_REPORTING",
        "CUSTOM_BRANDING",
        "API_ACCESS",
        "PRIORITY_SUPPORT",
        "MULTI_CAMPUS",
        "ADVANCED_ANALYTICS",
        "AI_POWERED_INSIGHTS",
        "AUTOMATED_WORKFLOWS",
        "ADVANCED_INTEGRATIONS",
        "MEMBER_ENGAGEMENT_SCORING",
        "PREDICTIVE_ANALYTICS",
        "BULK_OPERATIONS",
        "CUSTOM_FORMS",
        "WHITE_LABEL",
        "ADVANCED_SECURITY",
        "DATA_EXPORT_IMPORT",
        "SMS_MESSAGING",
        "VIDEO_CONFERENCING",
        "ADVANCED_SCHEDULING",
        "MEMBER_DIRECTORY_PRO",
        "AI_SEATING_GENERATOR", // Enterprise exclusive
      ];

    default:
      return [];
  }
}

/**
 * Get feature display information
 */
export function getFeatureInfo(feature: PremiumFeature): {
  name: string;
  description: string;
  plan: SubscriptionPlan;
} {
  const featureMap: Record<
    PremiumFeature,
    { name: string; description: string; plan: SubscriptionPlan }
  > = {
    BIOMETRIC_ATTENDANCE: {
      name: "Biometric Attendance",
      description: "Advanced fingerprint and face recognition attendance tracking",
      plan: "PREMIUM",
    },
    ADVANCED_REPORTING: {
      name: "Advanced Reporting",
      description: "Detailed analytics and custom report generation",
      plan: "BASIC",
    },
    CUSTOM_BRANDING: {
      name: "Custom Branding",
      description: "Customize colors, logos, and branding across the platform",
      plan: "PREMIUM",
    },
    API_ACCESS: {
      name: "API Access",
      description: "Full REST API access for custom integrations",
      plan: "ENTERPRISE",
    },
    PRIORITY_SUPPORT: {
      name: "Priority Support",
      description: "24/7 priority customer support with dedicated account manager",
      plan: "ENTERPRISE",
    },
    MULTI_CAMPUS: {
      name: "Multi-Campus",
      description: "Manage multiple church campuses from one account",
      plan: "ENTERPRISE",
    },
    ADVANCED_ANALYTICS: {
      name: "Advanced Analytics",
      description: "Deep insights into attendance, giving, and engagement trends",
      plan: "PREMIUM",
    },
    AI_POWERED_INSIGHTS: {
      name: "AI-Powered Insights",
      description: "Machine learning predictions and recommendations",
      plan: "ENTERPRISE",
    },
    AUTOMATED_WORKFLOWS: {
      name: "Automated Workflows",
      description: "Create custom automation rules for common tasks",
      plan: "ENTERPRISE",
    },
    ADVANCED_INTEGRATIONS: {
      name: "Advanced Integrations",
      description: "Connect with accounting, email, and other third-party tools",
      plan: "ENTERPRISE",
    },
    MEMBER_ENGAGEMENT_SCORING: {
      name: "Member Engagement Scoring",
      description: "Track and score member engagement automatically",
      plan: "ENTERPRISE",
    },
    PREDICTIVE_ANALYTICS: {
      name: "Predictive Analytics",
      description: "Forecast attendance, giving, and member retention",
      plan: "ENTERPRISE",
    },
    BULK_OPERATIONS: {
      name: "Bulk Operations",
      description: "Perform actions on multiple records at once",
      plan: "BASIC",
    },
    CUSTOM_FORMS: {
      name: "Custom Forms",
      description: "Create custom forms for surveys and data collection",
      plan: "BASIC",
    },
    WHITE_LABEL: {
      name: "White Label",
      description: "Remove all Shepherd branding and use your own",
      plan: "ENTERPRISE",
    },
    ADVANCED_SECURITY: {
      name: "Advanced Security",
      description: "Enhanced security features and compliance tools",
      plan: "ENTERPRISE",
    },
    DATA_EXPORT_IMPORT: {
      name: "Data Export/Import",
      description: "Bulk import and export data in multiple formats",
      plan: "PREMIUM",
    },
    SMS_MESSAGING: {
      name: "SMS Messaging",
      description: "Send text messages to members",
      plan: "PREMIUM",
    },
    VIDEO_CONFERENCING: {
      name: "Video Conferencing",
      description: "Built-in video conferencing for online services",
      plan: "ENTERPRISE",
    },
    ADVANCED_SCHEDULING: {
      name: "Advanced Scheduling",
      description: "Complex scheduling with resource management",
      plan: "PREMIUM",
    },
    MEMBER_DIRECTORY_PRO: {
      name: "Member Directory Pro",
      description: "Enhanced member directory with advanced search",
      plan: "BASIC",
    },
    AI_SEATING_GENERATOR: {
      name: "AI Seating Generator",
      description:
        "Automatically generate optimized seating arrangements based on room dimensions and capacity requirements",
      plan: "ENTERPRISE",
    },
  };

  return featureMap[feature];
}
