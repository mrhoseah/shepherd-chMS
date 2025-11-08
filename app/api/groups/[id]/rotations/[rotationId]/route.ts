import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Delete a rotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rotationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rotationId } = await params;

    await prisma.groupMeetingRotation.delete({
      where: { id: rotationId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting rotation:", error);
    return NextResponse.json(
      { error: "Failed to delete rotation" },
      { status: 500 }
    );
  }
}

// PATCH - Update a rotation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rotationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rotationId } = await params;
    const body = await request.json();

    const {
      locationType,
      memberId,
      locationName,
      address,
      notes,
      isActive,
    } = body;

    const updateData: any = {};
    if (locationType !== undefined) updateData.locationType = locationType;
    if (memberId !== undefined) {
      updateData.memberId = locationType === "member-house" ? memberId : null;
    }
    if (locationName !== undefined) updateData.locationName = locationName;
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;

    const rotation = await prisma.groupMeetingRotation.update({
      where: { id: rotationId },
      data: updateData,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            residence: true,
          },
        },
      },
    });

    return NextResponse.json(rotation);
  } catch (error: any) {
    console.error("Error updating rotation:", error);
    return NextResponse.json(
      { error: "Failed to update rotation" },
      { status: 500 }
    );
  }
}

