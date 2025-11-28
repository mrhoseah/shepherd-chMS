import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    const subscriptions = await prisma.subscription.findMany({
      include: {
        church: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(subscriptions);
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

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

    if (!user || !["SUPERADMIN", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      churchId,
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

    if (!churchId || !plan || !status || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });

    if (!church) {
      return NextResponse.json(
        { error: "Church not found" },
        { status: 404 }
      );
    }

    const existingSubscription = await prisma.subscription.findUnique({
      where: { churchId },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Subscription already exists for this church. Use PUT to update." },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        churchId,
        plan,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxMembers: maxMembers || 100,
        maxAdmins: maxAdmins || 5,
        maxCampuses: maxCampuses || 1,
        maxStorage: maxStorage || 1,
        nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
        paymentMethod: paymentMethod || null,
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
        action: "CREATE",
        entityType: "Subscription",
        entityId: subscription.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        churchId: null,
        metadata: {
          churchName: church.name,
          plan,
          status,
        },
      },
    });

    return NextResponse.json({
      message: "Subscription created successfully",
      subscription,
    });
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
