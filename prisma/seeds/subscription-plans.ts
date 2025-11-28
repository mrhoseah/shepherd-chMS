import { PrismaClient } from "../../lib/generated/prisma/client";
import { config } from "dotenv";

// Load environment variables
config();

const prisma = new PrismaClient();

export async function seedSubscriptionPlans() {
  console.log("🌱 Seeding subscription plans...");

  const plans = [
    {
      name: "basic",
      displayName: "Basic Plan",
      description: "Perfect for small churches just getting started with digital management",
      plan: "BASIC",
      monthlyPrice: 2500, // KES 2,500 per month (~$20)
      yearlyPrice: 24000, // KES 24,000 per year (~$192) - Save 20%
      currency: "KES",
      maxMembers: 200,
      maxAdmins: 3,
      maxCampuses: 1,
      maxStorage: 5, // 5GB
      features: [
        "Member management up to 200 members",
        "Basic attendance tracking",
        "Event management & registration",
        "Basic giving & donation tracking",
        "Group management",
        "SMS notifications (100/month)",
        "Email notifications (unlimited)",
        "Basic reports & analytics",
        "Mobile app access",
        "Email support",
      ],
      premiumFeatures: [],
      isActive: true,
      isPopular: false,
      sortOrder: 1,
      trialDays: 14,
    },
    {
      name: "standard",
      displayName: "Standard Plan",
      description: "Ideal for growing churches with multiple ministries and advanced needs",
      plan: "PREMIUM",
      monthlyPrice: 5000, // KES 5,000 per month (~$40)
      yearlyPrice: 48000, // KES 48,000 per year (~$384) - Save 20%
      currency: "KES",
      maxMembers: 1000,
      maxAdmins: 10,
      maxCampuses: 3,
      maxStorage: 25, // 25GB
      features: [
        "Member management up to 1,000 members",
        "Advanced attendance with check-in/check-out",
        "Event management with capacity limits",
        "Advanced giving (pledges, campaigns, receipts)",
        "Group management with rotation schedules",
        "SMS notifications (500/month)",
        "Email notifications (unlimited)",
        "Advanced reports & analytics",
        "Custom forms & workflows",
        "Volunteer management",
        "Asset & inventory tracking",
        "Multiple campuses (up to 3)",
        "Mobile app access",
        "Priority email support",
        "Training resources",
      ],
      premiumFeatures: [
        "ADVANCED_REPORTING",
        "MULTI_CAMPUS",
        "CUSTOM_FORMS",
        "SMS_MESSAGING",
        "ADVANCED_SCHEDULING",
      ],
      isActive: true,
      isPopular: true, // Most popular plan
      sortOrder: 2,
      trialDays: 14,
    },
    {
      name: "premium",
      displayName: "Premium Plan",
      description: "Complete solution for large churches with advanced features and unlimited growth",
      plan: "ENTERPRISE",
      monthlyPrice: 10000, // KES 10,000 per month (~$80)
      yearlyPrice: 96000, // KES 96,000 per year (~$768) - Save 20%
      currency: "KES",
      maxMembers: 10000,
      maxAdmins: 50,
      maxCampuses: 20,
      maxStorage: 100, // 100GB
      features: [
        "Unlimited member management",
        "Biometric attendance integration",
        "Advanced event management with livestream",
        "Complete giving suite (M-PESA, cards, bank)",
        "Advanced group management",
        "SMS notifications (2000/month)",
        "Email notifications (unlimited)",
        "AI-powered analytics & insights",
        "Custom branding & white-label",
        "API access for integrations",
        "Automated workflows & reminders",
        "Member engagement scoring",
        "Predictive analytics",
        "Bulk operations & data import/export",
        "Custom reports & dashboards",
        "Volunteer & staff management",
        "Asset management",
        "Financial management & budgeting",
        "Document management",
        "Multiple campuses (up to 20)",
        "Mobile app access",
        "Dedicated account manager",
        "24/7 Priority phone support",
        "Custom training & onboarding",
        "Advanced security features",
      ],
      premiumFeatures: [
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
      ],
      isActive: true,
      isPopular: false,
      sortOrder: 3,
      trialDays: 30, // Longer trial for premium
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlanTemplate.upsert({
      where: { name: plan.name },
      update: {
        displayName: plan.displayName,
        description: plan.description,
        plan: plan.plan as any,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        currency: plan.currency,
        maxMembers: plan.maxMembers,
        maxAdmins: plan.maxAdmins,
        maxCampuses: plan.maxCampuses,
        maxStorage: plan.maxStorage,
        features: plan.features,
        premiumFeatures: plan.premiumFeatures as any,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        sortOrder: plan.sortOrder,
        trialDays: plan.trialDays,
      },
      create: plan as any,
    });
    console.log(`  ✓ Created/Updated plan: ${plan.displayName}`);
  }

  console.log("✅ Subscription plans seeded successfully!");
}

// Run if executed directly
if (require.main === module) {
  seedSubscriptionPlans()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
