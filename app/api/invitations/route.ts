import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createInvitation,
  getInvitationByToken,
  getInvitationUrl,
} from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

// GET - Get invitation by token (public, for invitation page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Don't expose sensitive data
    return NextResponse.json({
      token: invitation.token,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      message: invitation.message,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      invitedBy: invitation.invitedBy
        ? {
            firstName: invitation.invitedBy.firstName,
            lastName: invitation.invitedBy.lastName,
          }
        : null,
      campus: invitation.campus
        ? {
            id: invitation.campus.id,
            name: invitation.campus.name,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error getting invitation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get invitation" },
      { status: 500 }
    );
  }
}

// POST - Create new invitation (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create invitations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      email,
      phone,
      firstName,
      lastName,
      role,
      campusId,
      message,
      expiresInDays,
      sendEmail,
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

    // Check if there's a pending invitation for this email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: "A pending invitation already exists for this email",
          invitation: {
            token: existingInvitation.token,
            url: getInvitationUrl(existingInvitation.token),
          },
        },
        { status: 409 }
      );
    }

    // Create invitation
    const invitation = await createInvitation({
      email,
      phone,
      firstName,
      lastName,
      role: role || "GUEST",
      campusId,
      invitedById: session.user.id,
      message,
      expiresInDays: expiresInDays || 7,
    });

    const invitationUrl = getInvitationUrl(invitation.token);

    // TODO: Send email if sendEmail is true
    // You can integrate with your email service here (e.g., SendGrid, AWS SES, etc.)

    return NextResponse.json(
      {
        success: true,
        invitation: {
          id: invitation.id,
          token: invitation.token,
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          url: invitationUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invitation" },
      { status: 500 }
    );
  }
}

