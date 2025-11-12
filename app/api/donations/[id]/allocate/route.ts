import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Manually allocate an unallocated donation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and pastors can allocate donations
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "PASTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { groupId, fundCategoryId, category, notes } = body;

    // Get the donation
    const donation = await prisma.donation.findUnique({
      where: { id },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (donation.status !== "unallocated") {
      return NextResponse.json(
        { error: "Donation is not unallocated" },
        { status: 400 }
      );
    }

    // Update donation
    const updatedDonation = await prisma.donation.update({
      where: { id },
      data: {
        groupId: groupId || null,
        fundCategoryId: fundCategoryId || null,
        category: category || donation.category,
        status: "completed",
        notes: notes || donation.notes,
        metadata: {
          ...((donation.metadata as any) || {}),
          manuallyAllocated: true,
          allocatedBy: (session.user as any).id,
          allocatedAt: new Date().toISOString(),
        },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            groupCode: true,
          },
        },
        fundCategory: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Trigger workflows if user is linked
    if (updatedDonation.userId) {
      Promise.resolve().then(async () => {
        try {
          const { executeWorkflows } = await import("@/lib/workflow-engine");
          await executeWorkflows({
            type: "DONATION_RECEIVED",
            userId: updatedDonation.userId || undefined,
            memberId: updatedDonation.userId || undefined,
            donationId: updatedDonation.id,
            data: {
              donation: updatedDonation,
              amount: Number(updatedDonation.amount),
              category: fundCategoryId ? "PAYBILL" : category || "OFFERING",
            },
          });
        } catch (error) {
          console.error("Failed to execute workflows:", error);
        }
      });
    }

    return NextResponse.json(updatedDonation);
  } catch (error: any) {
    console.error("Error allocating donation:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to allocate donation" },
      { status: 500 }
    );
  }
}

