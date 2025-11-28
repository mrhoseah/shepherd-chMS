import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single subscription plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.subscriptionPlanTemplate.findUnique({
      where: { id: params.id },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error("Error fetching subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plan" },
      { status: 500 }
    );
  }
}

// PUT - Update subscription plan (SUPERADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Forbidden - Only SUPERADMIN can update plans" },
        { status: 403 }
      );
    }

    const existingPlan = await prisma.subscriptionPlanTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
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

    const updatedPlan = await prisma.subscriptionPlanTemplate.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(displayName !== undefined && { displayName }),
        ...(description !== undefined && { description }),
        ...(plan !== undefined && { plan }),
        ...(monthlyPrice !== undefined && { monthlyPrice }),
        ...(yearlyPrice !== undefined && { yearlyPrice }),
        ...(currency !== undefined && { currency }),
        ...(maxMembers !== undefined && { maxMembers }),
        ...(maxAdmins !== undefined && { maxAdmins }),
        ...(maxCampuses !== undefined && { maxCampuses }),
        ...(maxStorage !== undefined && { maxStorage }),
        ...(features !== undefined && { features }),
        ...(premiumFeatures !== undefined && { premiumFeatures }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(trialDays !== undefined && { trialDays }),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "SubscriptionPlanTemplate",
        entityId: updatedPlan.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        description: `Updated subscription plan: ${updatedPlan.displayName}`,
        metadata: { 
          planName: updatedPlan.name, 
          changes: body 
        },
      },
    });

    return NextResponse.json({
      message: "Subscription plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error: any) {
    console.error("Error updating subscription plan:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A plan with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update subscription plan" },
      { status: 500 }
    );
  }
}

// DELETE - Delete subscription plan (SUPERADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Forbidden - Only SUPERADMIN can delete plans" },
        { status: 403 }
      );
    }

    const existingPlan = await prisma.subscriptionPlanTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    await prisma.subscriptionPlanTemplate.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "SubscriptionPlanTemplate",
        entityId: existingPlan.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        description: `Deleted subscription plan: ${existingPlan.displayName}`,
        metadata: { 
          planName: existingPlan.name,
          plan: existingPlan.plan,
        },
      },
    });

    return NextResponse.json({
      message: "Subscription plan deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription plan" },
      { status: 500 }
    );
  }
}
