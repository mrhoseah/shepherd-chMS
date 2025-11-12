import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Revoke Leadership API
 * Remove a leader from their assignments (groups, departments, ministries, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: leaderId } = await params;
    const body = await request.json();
    const { assignmentType, assignmentId } = body;

    if (!assignmentType || !assignmentId) {
      return NextResponse.json(
        { error: "Assignment type and ID are required" },
        { status: 400 }
      );
    }

    // Verify leader exists
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: { id: true, role: true },
    });

    if (!leader) {
      return NextResponse.json({ error: "Leader not found" }, { status: 404 });
    }

    let result;

    switch (assignmentType) {
      case "group":
        // Remove leader from group (set leaderId to null and update groupMember)
        await prisma.smallGroup.update({
          where: { id: assignmentId },
          data: { leaderId: null },
        });

        // Update groupMember to remove leader role
        await prisma.groupMember.updateMany({
          where: {
            groupId: assignmentId,
            userId: leaderId,
            isLeader: true,
          },
          data: {
            isLeader: false,
            role: "member",
          },
        });

        result = { message: "Leader removed from group" };
        break;

      case "department":
        // Remove leader from department
        await prisma.department.update({
          where: { id: assignmentId },
          data: { leaderId: null },
        });

        result = { message: "Leader removed from department" };
        break;

      case "childrenClass":
        // Remove leader from children class
        await prisma.childrenClass.update({
          where: { id: assignmentId },
          data: { leaderId: null },
        });

        result = { message: "Leader removed from children class" };
        break;

      case "youthGroup":
        // Remove leader from youth group
        await prisma.youthGroup.update({
          where: { id: assignmentId },
          data: { leaderId: null },
        });

        result = { message: "Leader removed from youth group" };
        break;

      case "groupMembership":
        // Remove leader role from group membership (but keep as member)
        // assignmentId here is the groupId, not the groupMember id
        await prisma.groupMember.updateMany({
          where: {
            groupId: assignmentId,
            userId: leaderId,
            isLeader: true,
          },
          data: {
            isLeader: false,
            role: "member",
          },
        });

        result = { message: "Leader role removed from group membership" };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid assignment type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error revoking leadership:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to revoke leadership" },
      { status: 500 }
    );
  }
}

