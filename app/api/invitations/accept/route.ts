import { NextRequest, NextResponse } from "next/server";
import { acceptInvitation } from "@/lib/invitations";

// POST - Accept invitation and create account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, middleName, phone, dateOfBirth, gender } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Accept invitation (creates user in both Cognito and database)
    const user = await acceptInvitation(token, password, {
      middleName,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. You can now sign in.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept invitation" },
      { status: 400 }
    );
  }
}

