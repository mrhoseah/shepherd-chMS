import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmSignUp } from "@/lib/cognito";

// POST - Confirm user sign up
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, confirmationCode } = body;

    if (!email || !confirmationCode) {
      return NextResponse.json(
        { error: "Email and confirmation code are required" },
        { status: 400 }
      );
    }

    // Confirm sign up in Cognito
    await confirmSignUp(email, confirmationCode);

    // Update user status in database
    const user = await prisma.user.update({
      where: { email },
      data: {
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    return NextResponse.json({
      message: "Account confirmed successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: any) {
    console.error("Error confirming sign up:", error);
    
    if (error.message?.includes("CodeMismatchException")) {
      return NextResponse.json(
        { error: "Invalid confirmation code" },
        { status: 400 }
      );
    }
    
    if (error.message?.includes("ExpiredCodeException")) {
      return NextResponse.json(
        { error: "Confirmation code has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to confirm sign up" },
      { status: 500 }
    );
  }
}

