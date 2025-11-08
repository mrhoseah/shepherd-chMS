import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all checks with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has finance permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "FINANCE" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const donorId = searchParams.get("donorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      churchId: (session.user as any).churchId || "default",
    };

    if (status) {
      where.status = status;
    }

    if (donorId) {
      where.donorId = donorId;
    }

    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) {
        where.receivedDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.receivedDate.lte = new Date(endDate);
      }
    }

    const [checks, total] = await Promise.all([
      prisma.check.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          receivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          depositedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          donation: {
            select: {
              id: true,
              amount: true,
              category: true,
            },
          },
        },
        orderBy: { receivedDate: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.check.count({ where }),
    ]);

    return NextResponse.json({
      checks,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error("Error fetching checks:", error);
    return NextResponse.json(
      { error: "Failed to fetch checks" },
      { status: 500 }
    );
  }
}

// POST - Create new check record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has finance permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "FINANCE" && user.role !== "ADMIN" && user.role !== "USHER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      checkNumber,
      amount,
      donorId,
      donorName,
      bankName,
      accountNumber,
      checkDate,
      notes,
      imageUrl,
      createDonation,
      donationCategory,
    } = body;

    if (!checkNumber || !amount) {
      return NextResponse.json(
        { error: "Check number and amount are required" },
        { status: 400 }
      );
    }

    const churchId = (session.user as any).churchId || "default";

    // Check if check number already exists
    const existingCheck = await prisma.check.findUnique({
      where: {
        churchId_checkNumber: {
          churchId,
          checkNumber,
        },
      },
    });

    if (existingCheck) {
      return NextResponse.json(
        { error: "Check number already exists" },
        { status: 409 }
      );
    }

    // Create check
    const check = await prisma.check.create({
      data: {
        checkNumber,
        amount: parseFloat(amount),
        donorId: donorId || null,
        donorName: donorName || null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        checkDate: checkDate ? new Date(checkDate) : null,
        receivedById: session.user.id,
        notes: notes || null,
        imageUrl: imageUrl || null,
        churchId,
        status: "PENDING",
      },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Optionally create donation record
    if (createDonation && donationCategory) {
      const donation = await prisma.donation.create({
        data: {
          userId: donorId || null,
          amount: parseFloat(amount),
          category: donationCategory,
          paymentMethod: "CHECK",
          status: "pending",
          notes: `Check #${checkNumber}`,
          check: {
            connect: { id: check.id },
          },
        },
      });

      // Link check to donation
      await prisma.check.update({
        where: { id: check.id },
        data: { donationId: donation.id },
      });
    }

    return NextResponse.json(check, { status: 201 });
  } catch (error: any) {
    console.error("Error creating check:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Check number already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create check" },
      { status: 500 }
    );
  }
}

