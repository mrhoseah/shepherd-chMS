import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccountNumber, validateGroupCode, validateFundCode } from "@/lib/services/paybill-parser";

// GET - Generate account number for paybill giving
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const fundCategoryId = searchParams.get("fundCategoryId");

    if (!groupId || !fundCategoryId) {
      return NextResponse.json(
        { error: "Group ID and Fund Category ID are required" },
        { status: 400 }
      );
    }

    // Get group and fund category
    const [group, fundCategory] = await Promise.all([
      prisma.smallGroup.findUnique({
        where: { id: groupId },
        select: { id: true, name: true, groupCode: true, groupGivingEnabled: true },
      }),
      prisma.fundCategory.findUnique({
        where: { id: fundCategoryId },
        select: { id: true, name: true, code: true, isActive: true },
      }),
    ]);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!fundCategory) {
      return NextResponse.json({ error: "Fund category not found" }, { status: 404 });
    }

    if (!group.groupGivingEnabled) {
      return NextResponse.json(
        { error: "Group giving is not enabled for this group" },
        { status: 400 }
      );
    }

    if (!group.groupCode) {
      return NextResponse.json(
        { error: "Group code is not set for this group" },
        { status: 400 }
      );
    }

    if (!fundCategory.isActive) {
      return NextResponse.json(
        { error: "Fund category is not active" },
        { status: 400 }
      );
    }

    // Generate account number
    const accountNumber = generateAccountNumber(group.groupCode, fundCategory.code);

    // Get paybill number from settings
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: { settings: true },
    });

    const paybillNumber =
      church?.settings.find((s) => s.key === "mpesa_paybill_number")?.value || "";

    return NextResponse.json({
      accountNumber,
      paybillNumber,
      groupName: group.name,
      fundName: fundCategory.name,
    });
  } catch (error: any) {
    console.error("Error generating account number:", error);
    return NextResponse.json(
      { error: "Failed to generate account number" },
      { status: 500 }
    );
  }
}

