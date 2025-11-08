import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to check if user is admin or pastor
async function requireAdminOrPastor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { authorized: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "PASTOR")) {
    return { authorized: false, error: "Forbidden" };
  }

  return { authorized: true };
}

// GET - Get all settings
export async function GET(request: NextRequest) {
  try {
    const check = await requireAdminOrPastor();
    if (!check.authorized) {
      return NextResponse.json(
        { error: check.error },
        { status: 403 }
      );
    }

    // Get the first active church (or you can get it from user's church association)
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: {
        settings: true,
      },
    });

    if (!church) {
      return NextResponse.json({ settings: {} });
    }

    // Convert settings array to object
    const settings: Record<string, any> = {};
    church.settings.forEach((setting) => {
      let value: any = setting.value;
      
      // Parse value based on type
      if (setting.type === "json") {
        try {
          value = JSON.parse(setting.value);
        } catch {
          value = setting.value;
        }
      } else if (setting.type === "number") {
        value = Number(setting.value);
      } else if (setting.type === "boolean") {
        value = setting.value === "true";
      }
      
      settings[setting.key] = value;
    });

    return NextResponse.json({ settings, churchId: church.id });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST - Save settings
export async function POST(request: NextRequest) {
  try {
    const check = await requireAdminOrPastor();
    if (!check.authorized) {
      return NextResponse.json(
        { error: check.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings, churchId } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      );
    }

    // Get or create church
    let church = await prisma.church.findFirst({
      where: { isActive: true },
    });

    if (!church) {
      // Create a default church if none exists
      church = await prisma.church.create({
        data: {
          name: "Eastgate Chapel",
          isActive: true,
        },
      });
    }

    // Save each setting
    const savedSettings = [];
    for (const [key, value] of Object.entries(settings)) {
      let stringValue: string;
      let type: string = "string";

      // Determine type and convert to string
      if (typeof value === "object" && value !== null) {
        stringValue = JSON.stringify(value);
        type = "json";
      } else if (typeof value === "number") {
        stringValue = String(value);
        type = "number";
      } else if (typeof value === "boolean") {
        stringValue = String(value);
        type = "boolean";
      } else {
        stringValue = String(value);
      }

      // Upsert setting
      const setting = await prisma.churchSetting.upsert({
        where: {
          churchId_key: {
            churchId: church.id,
            key,
          },
        },
        update: {
          value: stringValue,
          type,
        },
        create: {
          churchId: church.id,
          key,
          value: stringValue,
          type,
        },
      });

      savedSettings.push(setting);
    }

    return NextResponse.json({
      message: "Settings saved successfully",
      settings: savedSettings,
    });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}

