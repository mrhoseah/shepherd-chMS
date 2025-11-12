import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvitation, getInvitationUrl } from "@/lib/invitations";
import { notifyNewGuest } from "@/lib/notifications";

// GET - List all people with pagination
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
    const roles = searchParams.get("roles") || ""; // Support multiple roles (comma-separated)
    const excludeRoles = searchParams.get("excludeRoles") || ""; // Exclude multiple roles (comma-separated)
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
    
    // Handle single role or multiple roles
    if (roles) {
      const roleArray = roles.split(",").map((r) => r.trim());
      where.role = { in: roleArray };
    } else if (role) {
      where.role = role;
    }
    
    // Handle excluding roles (only if not already filtering by specific roles)
    if (excludeRoles && !roles && !role) {
      const excludeRoleArray = excludeRoles.split(",").map((r) => r.trim());
      where.role = { notIn: excludeRoleArray };
    }
    
    if (status) where.status = status;

    const [people, total] = await Promise.all([
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
      people,
      users: people, // Keep for backward compatibility
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

// POST - Create new person
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

    // Check if person already exists
    const existingPerson = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingPerson) {
      return NextResponse.json(
        { error: "Person with this email already exists" },
        { status: 409 }
      );
    }

    // Create invitation for the person (they'll set password when accepting)
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

    // Create person in database (status will be PENDING until they accept invitation)
    const person = await prisma.user.create({
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

    // Link invitation to person
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { userId: person.id },
    });

    // Notify pastors and leaders if this is a new guest
    if ((role || "GUEST") === "GUEST") {
      notifyNewGuest(person.id).catch((error) => {
        console.error("Failed to send guest notification:", error);
      });
    }

    // Trigger workflows for member creation (async, don't block response)
    Promise.resolve().then(async () => {
      try {
        const { executeWorkflows } = await import("@/lib/workflow-engine");
        await executeWorkflows({
          type: "MEMBER_CREATED",
          userId: person.id,
          memberId: person.id,
          data: {
            person,
            role: role || "GUEST",
          },
        });
      } catch (error) {
        console.error("Failed to execute workflows:", error);
      }
    });

    // TODO: Send invitation email if sendInvitation is true
    // You can integrate with your email service here

    return NextResponse.json(
      {
        ...person,
        invitation: {
          token: invitation.token,
          url: invitationUrl,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating person:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or phone already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 }
    );
  }
}

