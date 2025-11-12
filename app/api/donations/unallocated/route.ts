import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get unallocated donations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and pastors can view unallocated donations
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "PASTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const donations = await prisma.donation.findMany({
      where: {
        status: "unallocated",
        paymentMethod: "MPESA",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
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
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.donation.count({
      where: {
        status: "unallocated",
        paymentMethod: "MPESA",
      },
    });

    return NextResponse.json({
      donations,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching unallocated donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch unallocated donations" },
      { status: 500 }
    );
  }
}

