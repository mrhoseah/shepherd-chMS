import { prisma } from "./prisma";
import { randomBytes } from "crypto";
import { createCognitoUser } from "./cognito";

/**
 * Generate a secure invitation token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Create a new invitation
 */
export async function createInvitation(data: {
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role?: "ADMIN" | "PASTOR" | "LEADER" | "MEMBER" | "GUEST";
  campusId?: string;
  invitedById?: string;
  message?: string;
  expiresInDays?: number;
}) {
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7)); // Default 7 days

  const invitation = await prisma.invitation.create({
    data: {
      token,
      email: data.email.toLowerCase(),
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || "GUEST",
      campusId: data.campusId,
      invitedById: data.invitedById,
      message: data.message,
      expiresAt,
    },
  });

  return invitation;
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      invitedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      campus: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  // Check if expired
  if (invitation.expiresAt < new Date() && invitation.status === "PENDING") {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return { ...invitation, status: "EXPIRED" as const };
  }

  return invitation;
}

/**
 * Accept invitation - creates user in database and Cognito
 */
export async function acceptInvitation(
  token: string,
  password: string,
  additionalData?: {
    middleName?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  }
) {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    throw new Error(`Invitation is ${invitation.status.toLowerCase()}`);
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("Invitation has expired");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Create user in Cognito first
  let cognitoUserId: string | undefined;
  try {
    await createCognitoUser(
      invitation.email,
      password,
      invitation.firstName,
      invitation.lastName,
      additionalData?.phone || invitation.phone || undefined,
      additionalData?.middleName,
      undefined // picture
    );
    // Note: createCognitoUser doesn't return the user ID, but we can get it from getUserFromToken later
  } catch (error: any) {
    // If user already exists in Cognito, that's okay - they might have signed up directly
    if (error.name !== "UsernameExistsException") {
      throw error;
    }
  }

  // Create user in database
  const user = await prisma.user.create({
    data: {
      email: invitation.email,
      phone: additionalData?.phone || invitation.phone || null,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      middleName: additionalData?.middleName || null,
      role: invitation.role,
      status: "ACTIVE", // Invited users are automatically active
      canLogin: true, // Invited users can login
      campusId: invitation.campusId,
      emailVerified: true, // Cognito handles email verification
      phoneVerified: !!invitation.phone,
      dateOfBirth: additionalData?.dateOfBirth,
      gender: additionalData?.gender,
    },
  });

  // Update invitation
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      userId: user.id,
    },
  });

  return user;
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Only pending invitations can be cancelled");
  }

  return await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "CANCELLED" },
  });
}

/**
 * Get invitation URL for email
 */
export function getInvitationUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base}/auth/invite/${token}`;
}

