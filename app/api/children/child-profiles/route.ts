import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get child profiles for parent
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (childId) {
      // Get specific child profile
      const profile = await prisma.childProfile.findFirst({
        where: {
          childId,
          parentId: user.id,
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              dateOfBirth: true,
              gender: true,
            },
          },
          teacherNotes: {
            where: {
              visibility: {
                in: ["PARENT_ONLY", "PARENT_AND_STAFF"],
              },
            },
            orderBy: { date: "desc" },
            take: 10,
            include: {
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          classroomLogs: {
            orderBy: { sessionDate: "desc" },
            take: 10,
            include: {
              class: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      return NextResponse.json({ profile });
    }

    // Get all child profiles for parent
    const profiles = await prisma.childProfile.findMany({
      where: { parentId: user.id },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            dateOfBirth: true,
          },
        },
        _count: {
          select: {
            teacherNotes: true,
            classroomLogs: true,
          },
        },
      },
    });

    return NextResponse.json({ profiles });
  } catch (error: any) {
    console.error("Error fetching child profiles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}

// POST - Create child profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      childId,
      allergies,
      medications,
      medicalConditions,
      emergencyInstructions,
      authorizedPickups,
      unauthorizedPersons,
      parentDailyNotes,
      photoVideoConsent,
      communicationConsent,
    } = body;

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // Verify the child is actually the user's child
    const child = await prisma.user.findFirst({
      where: {
        id: childId,
        parentId: user.id,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found or not authorized" },
        { status: 403 }
      );
    }

    const profile = await prisma.childProfile.create({
      data: {
        childId,
        parentId: user.id,
        allergies: allergies || [],
        medications: medications || [],
        medicalConditions: medicalConditions || [],
        emergencyInstructions,
        authorizedPickups: authorizedPickups || [],
        unauthorizedPersons: unauthorizedPersons || [],
        parentDailyNotes,
        photoVideoConsent: photoVideoConsent ?? false,
        communicationConsent: communicationConsent ?? true,
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating child profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create profile" },
      { status: 500 }
    );
  }
}

// PUT - Update child profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { profileId, ...updates } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.childProfile.findFirst({
      where: {
        id: profileId,
        parentId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = await prisma.childProfile.update({
      where: { id: profileId },
      data: updates,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("Error updating child profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
