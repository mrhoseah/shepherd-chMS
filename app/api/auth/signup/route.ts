import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signUpWithCognito } from "@/lib/cognito";

// POST - Sign up new user (self-registration)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, middleName, picture } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, password, first name, and last name are required" },
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

    // Sign up user in Cognito
    const cognitoResponse = await signUpWithCognito(
      email,
      password,
      firstName,
      lastName,
      phone,
      middleName,
      picture
    );

    // Create user in database (even if Cognito confirmation is pending)
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        firstName,
        middleName: middleName || null,
        lastName,
        role: "GUEST",
        status: "PENDING", // Will be activated after Cognito confirmation
        profileImage: picture || null,
        emailVerified: false, // Will be true after Cognito confirmation
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully. Please check your email for confirmation code.",
        user,
        requiresConfirmation: !!cognitoResponse.codeDeliveryDetails,
        codeDeliveryDetails: cognitoResponse.codeDeliveryDetails,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error signing up user:", error);
    
    // Handle Cognito-specific errors
    if (error.message?.includes("UsernameExistsException")) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    if (error.message?.includes("InvalidPasswordException")) {
      return NextResponse.json(
        { error: "Password does not meet requirements" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to sign up" },
      { status: 500 }
    );
  }
}

