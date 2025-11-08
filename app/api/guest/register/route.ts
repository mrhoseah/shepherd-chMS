import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewGuest } from "@/lib/notifications";

// POST - Public guest registration (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, firstName, lastName, email, phone, residence, city, county, country, enableFollowUps } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // At least one contact method required
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Please provide either an email or phone number" },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingByEmail) {
        return NextResponse.json(
          { error: "A guest with this email already exists" },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const existingByPhone = await prisma.user.findUnique({
        where: { phone },
      });
      if (existingByPhone) {
        return NextResponse.json(
          { error: "A guest with this phone number already exists" },
          { status: 409 }
        );
      }
    }

    // Create guest user (no password, no Cognito - they can sign up later if needed)
    const user = await prisma.user.create({
      data: {
        title: title || null,
        email: email || null,
        phone: phone || null,
        firstName,
        lastName,
        residence: residence || null,
        city: city || null,
        county: county || null,
        country: country || null,
        role: "GUEST",
        status: "PENDING",
        enableFollowUps: enableFollowUps !== undefined ? enableFollowUps : true,
        emailVerified: false,
        phoneVerified: false,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Notify pastors, leaders, and admins about new guest (async, don't wait)
    notifyNewGuest(user.id)
      .then(() => {
        console.log(`Notification process started for guest: ${user.firstName} ${user.lastName} (${user.id})`);
      })
      .catch((error) => {
        console.error("Failed to send guest notification:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for registering! We'll be in touch soon.",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error registering guest:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or phone number already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to register guest" },
      { status: 500 }
    );
  }
}

