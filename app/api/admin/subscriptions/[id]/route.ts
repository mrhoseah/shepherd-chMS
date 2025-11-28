import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    if (!user || !["SUPERADMIN", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      plan,
      status,
      startDate,
      endDate,
      maxMembers,
      maxAdmins,
      maxCampuses,
      maxStorage,
      nextBillingDate,
      paymentMethod,
    } = body;

    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: {
        church: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const subscription = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        ...(plan && { plan }),
        ...(status && { status }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(maxMembers !== undefined && { maxMembers }),
        ...(maxAdmins !== undefined && { maxAdmins }),
        ...(maxCampuses !== undefined && { maxCampuses }),
        ...(maxStorage !== undefined && { maxStorage }),
        ...(nextBillingDate !== undefined && {
          nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
        }),
        ...(paymentMethod !== undefined && { paymentMethod }),
      },
      include: {
        church: {
          select: {
            name: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "Subscription",
        entityId: subscription.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        churchId: null,
        metadata: {
          churchName: subscription.church.name,
          plan: subscription.plan,
          status: subscription.status,
          changes: body,
        },
      },
    });

    return NextResponse.json({
      message: "Subscription updated successfully",
      subscription,
    });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

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
        { error: "Unauthorized - Only SUPERADMIN can delete subscriptions" },
        { status: 403 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: {
        church: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    await prisma.subscription.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "Subscription",
        entityId: subscription.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        churchId: null,
        metadata: {
          churchName: subscription.church.name,
          plan: subscription.plan,
        },
      },
    });

    return NextResponse.json({
      message: "Subscription deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
