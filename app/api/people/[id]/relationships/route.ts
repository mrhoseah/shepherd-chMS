import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get member relationships for visualization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the member with all relationships
    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        spouse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            role: true,
            status: true,
          },
        },
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            role: true,
            status: true,
            spouse: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        children: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            role: true,
            status: true,
            spouse: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
            children: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                dateOfBirth: true,
              },
            },
          },
        },
        familyHead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        familyMembers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Build relationship tree structure
    const relationships = {
      member: {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        profileImage: member.profileImage,
        dateOfBirth: member.dateOfBirth,
        role: member.role,
        status: member.status,
      },
      spouse: member.spouse
        ? {
            id: member.spouse.id,
            name: `${member.spouse.firstName} ${member.spouse.lastName}`,
            firstName: member.spouse.firstName,
            lastName: member.spouse.lastName,
            email: member.spouse.email,
            phone: member.spouse.phone,
            profileImage: member.spouse.profileImage,
            dateOfBirth: member.spouse.dateOfBirth,
            role: member.spouse.role,
            status: member.spouse.status,
          }
        : null,
      parents: member.parent
        ? [
            {
              id: member.parent.id,
              name: `${member.parent.firstName} ${member.parent.lastName}`,
              firstName: member.parent.firstName,
              lastName: member.parent.lastName,
              email: member.parent.email,
              phone: member.parent.phone,
              profileImage: member.parent.profileImage,
              dateOfBirth: member.parent.dateOfBirth,
              role: member.parent.role,
              status: member.parent.status,
            },
            ...(member.parent.spouse
              ? [
                  {
                    id: member.parent.spouse.id,
                    name: `${member.parent.spouse.firstName} ${member.parent.spouse.lastName}`,
                    firstName: member.parent.spouse.firstName,
                    lastName: member.parent.spouse.lastName,
                    profileImage: member.parent.spouse.profileImage,
                  },
                ]
              : []),
          ]
        : [],
      children: member.children.map((child) => ({
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        firstName: child.firstName,
        lastName: child.lastName,
        email: child.email,
        phone: child.phone,
        profileImage: child.profileImage,
        dateOfBirth: child.dateOfBirth,
        role: child.role,
        status: child.status,
        spouse: child.spouse
          ? {
              id: child.spouse.id,
              name: `${child.spouse.firstName} ${child.spouse.lastName}`,
              profileImage: child.spouse.profileImage,
            }
          : null,
        grandchildren: child.children.map((grandchild) => ({
          id: grandchild.id,
          name: `${grandchild.firstName} ${grandchild.lastName}`,
          profileImage: grandchild.profileImage,
          dateOfBirth: grandchild.dateOfBirth,
        })),
      })),
      siblings: [], // Will be populated if needed
      familyMembers: member.familyMembers.map((fm) => ({
        id: fm.id,
        name: `${fm.firstName} ${fm.lastName}`,
        firstName: fm.firstName,
        lastName: fm.lastName,
        email: fm.email,
        phone: fm.phone,
        profileImage: fm.profileImage,
        dateOfBirth: fm.dateOfBirth,
        role: fm.role,
        status: fm.status,
      })),
    };

    // Get siblings (children of same parent)
    if (member.parentId) {
      const siblings = await prisma.user.findMany({
        where: {
          parentId: member.parentId,
          id: { not: id },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
          dateOfBirth: true,
          role: true,
          status: true,
        },
      });
      relationships.siblings = siblings.map((sibling) => ({
        id: sibling.id,
        name: `${sibling.firstName} ${sibling.lastName}`,
        firstName: sibling.firstName,
        lastName: sibling.lastName,
        email: sibling.email,
        phone: sibling.phone,
        profileImage: sibling.profileImage,
        dateOfBirth: sibling.dateOfBirth,
        role: sibling.role,
        status: sibling.status,
      }));
    }

    return NextResponse.json({ relationships });
  } catch (error: any) {
    console.error("Error fetching relationships:", error);
    return NextResponse.json(
      { error: "Failed to fetch relationships" },
      { status: 500 }
    );
  }
}

