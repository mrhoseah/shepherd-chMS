import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

const ALLOWED_SYSTEM_ROLES = ["SUPERADMIN", "SYSTEM_ADMIN", "SYSTEM_SUPPORT"];

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

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only SUPERADMIN can view system invitations" },
        { status: 403 }
      );
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        invitationType: "SYSTEM_ADMIN",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error("Error fetching system invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
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

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only SUPERADMIN can send system invitations" },
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

    if (!ALLOWED_SYSTEM_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid system role. Must be one of: ${ALLOWED_SYSTEM_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: "PENDING",
        invitationType: "SYSTEM_ADMIN",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Pending system invitation already exists for this email" },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        firstName,
        lastName,
        phone: phone || null,
        role,
        token,
        expiresAt,
        invitationType: "SYSTEM_ADMIN",
        churchId: null,
        invitedById: user.id,
      },
    });

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation/${token}`;

    await sendEmail({
      to: email,
      subject: "System Administrator Invitation - Shepherd ChMS",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .role-badge { background: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ System Administrator Invitation</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName} ${lastName},</p>
              
              <p><strong>${user.firstName} ${user.lastName}</strong> has invited you to join Shepherd ChMS as a <span class="role-badge">${role}</span></p>
              
              ${message ? `<p><em>"${message}"</em></p>` : ""}
              
              <p>As a system administrator, you will have privileged access to manage the Shepherd ChMS platform.</p>
              
              <div style="text-align: center;">
                <a href="${acceptUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                ${acceptUrl}
              </p>
              
              <p><strong>This invitation expires in 7 days.</strong></p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              
              <p style="font-size: 12px; color: #6b7280;">
                If you did not expect this invitation, please disregard this email.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Shepherd ChMS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    await prisma.auditLog.create({
      data: {
        action: "INVITE",
        entityType: "Invitation",
        entityId: invitation.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        churchId: null,
        metadata: {
          inviteeEmail: email,
          inviteeName: `${firstName} ${lastName}`,
          role,
          invitationType: "SYSTEM_ADMIN",
        },
      },
    });

    return NextResponse.json({
      message: "System admin invitation sent successfully",
      invitation,
    });
  } catch (error: any) {
    console.error("Error creating system invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
