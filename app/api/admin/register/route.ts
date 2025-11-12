import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCognitoUser } from "@/lib/cognito";

// POST - Create admin user (only if no admin exists)
export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin user already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user in Cognito first
    try {
      await createCognitoUser(email, password, firstName, lastName);
    } catch (error: any) {
      // If user already exists in Cognito, continue (might be from previous attempt)
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("UsernameExistsException") ||
        error.name === "UsernameExistsException"
      ) {
        console.log(`User already exists in Cognito: ${email}`);
      } else {
        console.error("Error creating user in Cognito:", error);
        return NextResponse.json(
          { error: `Failed to create user in Cognito: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Create admin user in database
    const admin = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: "ADMIN",
        status: "ACTIVE",
        canLogin: true,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        message: "Admin account created successfully",
        user: admin,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating admin:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create admin account" },
      { status: 500 }
    );
  }
}

