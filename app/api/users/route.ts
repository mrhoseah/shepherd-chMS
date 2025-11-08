import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvitation, getInvitationUrl } from "@/lib/invitations";
import { notifyNewGuest } from "@/lib/notifications";

// GET - List all users with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          title: true,
          residence: true,
          city: true,
          county: true,
          country: true,
          role: true,
          status: true,
          canLogin: true,
          campus: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      phone,
      firstName,
      lastName,
      role,
      status,
      campusId,
      sendInvitation, // Whether to send invitation email
    } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, first name, and last name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create invitation for the user (they'll set password when accepting)
    const invitation = await createInvitation({
      email,
      phone,
      firstName,
      lastName,
      role: role || "GUEST",
      campusId,
      invitedById: session.user.id,
      expiresInDays: 7,
    });

    const invitationUrl = getInvitationUrl(invitation.token);

    // Create user in database (status will be PENDING until they accept invitation)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        phone,
        firstName,
        lastName,
        role: role || "GUEST",
        status: status || "PENDING", // Will be ACTIVE after accepting invitation
        campusId,
        emailVerified: false, // Will be verified when they accept invitation
        canLogin: false, // Will be enabled when they accept invitation
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

    // Link invitation to user
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { userId: user.id },
    });

    // Notify pastors and leaders if this is a new guest
    if ((role || "GUEST") === "GUEST") {
      notifyNewGuest(user.id).catch((error) => {
        console.error("Failed to send guest notification:", error);
      });
    }

    // TODO: Send invitation email if sendInvitation is true
    // You can integrate with your email service here

    return NextResponse.json(
      {
        ...user,
        invitation: {
          token: invitation.token,
          url: invitationUrl,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or phone already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

