import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all subscription plan templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Public endpoint - no auth required for viewing active plans
    const plans = await prisma.subscriptionPlanTemplate.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}

// POST - Create new subscription plan (SUPERADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true, firstName: true, lastName: true, email: true },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Only SUPERADMIN can create plans" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      displayName,
      description,
      plan,
      monthlyPrice,
      yearlyPrice,
      currency,
      maxMembers,
      maxAdmins,
      maxCampuses,
      maxStorage,
      features,
      premiumFeatures,
      isActive,
      isPopular,
      sortOrder,
      trialDays,
    } = body;

    if (!name || !displayName || !plan || monthlyPrice === undefined || yearlyPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const planTemplate = await prisma.subscriptionPlanTemplate.create({
      data: {
        name,
        displayName,
        description: description || null,
        plan,
        monthlyPrice,
        yearlyPrice,
        currency: currency || "KES",
        maxMembers: maxMembers || 100,
        maxAdmins: maxAdmins || 5,
        maxCampuses: maxCampuses || 1,
        maxStorage: maxStorage || 5,
        features: features || [],
        premiumFeatures: premiumFeatures || [],
        isActive: isActive !== undefined ? isActive : true,
        isPopular: isPopular || false,
        sortOrder: sortOrder || 0,
        trialDays: trialDays || 14,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "SubscriptionPlanTemplate",
        entityId: planTemplate.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        description: `Created subscription plan: ${displayName}`,
        metadata: { planName: name, plan },
      },
    });

    return NextResponse.json({
      message: "Subscription plan created successfully",
      plan: planTemplate,
    });
  } catch (error: any) {
    console.error("Error creating subscription plan:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A plan with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create subscription plan" },
      { status: 500 }
    );
  }
}
