import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// GET - Fetch church invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's campus and church
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { campusId: true, campus: { select: { churchId: true } } },
    });

    if (!user?.campus?.churchId) {
      return NextResponse.json({ error: "No church found" }, { status: 404 });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        churchId: user.campus.churchId,
        invitationType: "CHURCH_ADMIN",
      },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST - Send invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ADMIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        campusId: true,
        campus: { select: { churchId: true, church: { select: { name: true } } } },
        firstName: true,
        lastName: true,
      },
    });

    if (!user?.campus?.churchId) {
      return NextResponse.json({ error: "No church found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Only admins can send invitations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, phone, role, message } = body;

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check for pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: "PENDING",
        churchId: user.campus.churchId,
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Pending invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        token,
        email,
        phone,
        firstName,
        lastName,
        role,
        churchId: user.campus.churchId,
        campusId: user.campusId,
        invitationType: "CHURCH_ADMIN",
        invitedById: session.user.id,
        message,
        expiresAt,
      },
    });

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invitation/${token}`;
    await sendEmail({
      to: email,
      subject: `Invitation to join ${user.campus.church.name}`,
      html: `
        <h2>You've been invited!</h2>
        <p>Hi ${firstName},</p>
        <p>${user.firstName} ${user.lastName} has invited you to join ${user.campus.church.name} as a <strong>${role}</strong>.</p>
        ${message ? `<p><em>"${message}"</em></p>` : ""}
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
        <p>This invitation expires on ${expiresAt.toLocaleDateString()}.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      `,
      churchId: user.campus.churchId,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: "INVITE",
        entity: "Invitation",
        entityId: invitation.id,
        entityName: `${firstName} ${lastName} (${email})`,
        description: `Invited ${firstName} ${lastName} as ${role}`,
        metadata: { invitation },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
