import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Add family member or update family photo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { relationship, memberId, familyPhoto, familyHeadId, familyName } = body;

    // Update family photo
    if (familyPhoto !== undefined) {
      const user = await prisma.user.update({
        where: { id },
        data: { familyPhoto },
      });
      return NextResponse.json(user);
    }

    // Update family name
    if (familyName !== undefined) {
      console.log("Updating family name:", { id, familyName });
      // Get all family members
      const currentUser = await prisma.user.findUnique({
        where: { id },
        include: {
          spouse: {
            include: {
              children: true,
              parent: true,
            },
          },
          children: true,
          parent: {
            include: {
              spouse: true,
              children: true,
            },
          },
        },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Collect all family member IDs
      const familyMemberIds = new Set<string>([id]);
      
      if (currentUser.spouse) {
        familyMemberIds.add(currentUser.spouse.id);
        currentUser.spouse.children?.forEach(child => familyMemberIds.add(child.id));
        if (currentUser.spouse.parent) familyMemberIds.add(currentUser.spouse.parent.id);
      }
      
      currentUser.children.forEach(child => familyMemberIds.add(child.id));
      
      if (currentUser.parent) {
        familyMemberIds.add(currentUser.parent.id);
        if (currentUser.parent.spouse) familyMemberIds.add(currentUser.parent.spouse.id);
        currentUser.parent.children?.forEach(child => familyMemberIds.add(child.id));
      }

      // Update family name for all family members
      await prisma.user.updateMany({
        where: { id: { in: Array.from(familyMemberIds) } },
        data: { familyName: familyName || null },
      });

      // Return updated user
      const updatedUser = await prisma.user.findUnique({
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
            },
          },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          children: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
            },
          },
          familyHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!updatedUser) {
        console.error("Failed to retrieve updated user after family name update");
        return NextResponse.json(
          { error: "Failed to retrieve updated user" },
          { status: 500 }
        );
      }

      console.log("Family name updated successfully");
      return NextResponse.json(updatedUser);
    }

    // Update family head
    if (familyHeadId !== undefined) {
      // If setting to null, remove family head
      if (familyHeadId === null) {
        // Remove family head from all family members
        const currentUser = await prisma.user.findUnique({
          where: { id },
          include: {
            spouse: true,
            children: true,
            parent: true,
          },
        });

        if (currentUser) {
          // Get all family members
          const familyMemberIds = [id];
          if (currentUser.spouse) familyMemberIds.push(currentUser.spouse.id);
          if (currentUser.parent) familyMemberIds.push(currentUser.parent.id);
          currentUser.children.forEach(child => familyMemberIds.push(child.id));

          // Remove family head from all
          await prisma.user.updateMany({
            where: { id: { in: familyMemberIds } },
            data: { familyHeadId: null },
          });
        }
      } else {
        // Set family head
        // First, get all family members (spouse, children, parent, and their families)
        const currentUser = await prisma.user.findUnique({
          where: { id },
          include: {
            spouse: {
              include: {
                children: true,
                parent: true,
              },
            },
            children: true,
            parent: {
              include: {
                spouse: true,
                children: true,
              },
            },
          },
        });

        if (currentUser) {
          // Collect all family member IDs
          const familyMemberIds = new Set<string>([id]);
          
          if (currentUser.spouse) {
            familyMemberIds.add(currentUser.spouse.id);
            currentUser.spouse.children?.forEach(child => familyMemberIds.add(child.id));
            if (currentUser.spouse.parent) familyMemberIds.add(currentUser.spouse.parent.id);
          }
          
          currentUser.children.forEach(child => familyMemberIds.add(child.id));
          
          if (currentUser.parent) {
            familyMemberIds.add(currentUser.parent.id);
            if (currentUser.parent.spouse) familyMemberIds.add(currentUser.parent.spouse.id);
            currentUser.parent.children?.forEach(child => familyMemberIds.add(child.id));
          }

          // Verify the familyHeadId is a family member
          if (!familyMemberIds.has(familyHeadId)) {
            return NextResponse.json(
              { error: "Family head must be a family member" },
              { status: 400 }
            );
          }

          // Set family head for all family members
          await prisma.user.updateMany({
            where: { id: { in: Array.from(familyMemberIds) } },
            data: { familyHeadId },
          });
        }
      }

      // Return updated user
      const updatedUser = await prisma.user.findUnique({
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
            },
          },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          children: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
            },
          },
          familyHead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return NextResponse.json(updatedUser);
    }

    // If no valid operation was specified, return error
    if (
      familyPhoto === undefined &&
      familyHeadId === undefined &&
      familyName === undefined &&
      (!relationship || !memberId)
    ) {
      return NextResponse.json(
        { error: "No valid operation specified. Provide familyPhoto, familyHeadId, familyName, or relationship/memberId" },
        { status: 400 }
      );
    }

    // Add family member
    if (!relationship || !memberId) {
      return NextResponse.json(
        { error: "Relationship and memberId are required" },
        { status: 400 }
      );
    }

    const targetMember = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    switch (relationship) {
      case "spouse":
        // Set bidirectional spouse relationship
        await prisma.user.update({
          where: { id },
          data: { spouseId: memberId },
        });
        await prisma.user.update({
          where: { id: memberId },
          data: { spouseId: id },
        });
        break;

      case "parent":
        await prisma.user.update({
          where: { id },
          data: { parentId: memberId },
        });
        break;

      case "child":
        await prisma.user.update({
          where: { id: memberId },
          data: { parentId: id },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid relationship. Must be 'spouse', 'parent', or 'child'" },
          { status: 400 }
        );
    }

    // Return updated user with family relations
    const updatedUser = await prisma.user.findUnique({
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
          },
        },
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        children: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating family:", error);
    const errorMessage = error?.message || "Failed to update family";
    return NextResponse.json(
      { error: errorMessage, details: error?.code || "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE - Remove family relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const relationship = searchParams.get("relationship");
    const memberId = searchParams.get("memberId");

    if (!relationship) {
      return NextResponse.json(
        { error: "Relationship is required" },
        { status: 400 }
      );
    }

    switch (relationship) {
      case "spouse":
        // Remove bidirectional spouse relationship
        await prisma.user.update({
          where: { id },
          data: { spouseId: null },
        });
        if (memberId) {
          await prisma.user.update({
            where: { id: memberId },
            data: { spouseId: null },
          });
        }
        break;

      case "parent":
        await prisma.user.update({
          where: { id },
          data: { parentId: null },
        });
        break;

      case "child":
        if (!memberId) {
          return NextResponse.json(
            { error: "memberId is required for removing child relationship" },
            { status: 400 }
          );
        }
        await prisma.user.update({
          where: { id: memberId },
          data: { parentId: null },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid relationship" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing family relationship:", error);
    return NextResponse.json(
      { error: "Failed to remove family relationship" },
      { status: 500 }
    );
  }
}

