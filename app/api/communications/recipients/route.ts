import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get recipients by type
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // leaders, groups, individuals, guests, admins

    switch (type) {
      case "leaders": {
        const leaders = await prisma.user.findMany({
          where: {
            role: { in: ["PASTOR", "LEADER"] },
            status: "ACTIVE",
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
          orderBy: { lastName: "asc" },
        });
        return NextResponse.json({ recipients: leaders });
      }

      case "admins": {
        const admins = await prisma.user.findMany({
          where: {
            role: "ADMIN",
            status: "ACTIVE",
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
          orderBy: { lastName: "asc" },
        });
        return NextResponse.json({ recipients: admins });
      }

      case "guests": {
        const guests = await prisma.user.findMany({
          where: {
            role: "GUEST",
            status: { in: ["ACTIVE", "PENDING"] },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
          orderBy: { lastName: "asc" },
        });
        return NextResponse.json({ recipients: guests });
      }

      case "groups": {
        const groups = await prisma.smallGroup.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: { members: true },
            },
          },
          orderBy: { name: "asc" },
        });
        return NextResponse.json({ groups });
      }

      case "individuals": {
        // Get all active members
        const individuals = await prisma.user.findMany({
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
          orderBy: { lastName: "asc" },
        });
        return NextResponse.json({ recipients: individuals });
      }

      default:
        return NextResponse.json(
          { error: "Invalid recipient type" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipients" },
      { status: 500 }
    );
  }
}

