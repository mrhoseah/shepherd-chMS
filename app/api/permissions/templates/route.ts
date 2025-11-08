import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { initializeTemplatePolicies } from "@/lib/casbin";
import { ROLE_TEMPLATES, templateToCasbinPolicies } from "@/lib/role-templates";

// GET - Get all role templates
export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      );
    }

    return NextResponse.json({ templates: ROLE_TEMPLATES });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Apply template to a role
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { templateId, roleName } = body;

    if (!templateId || !roleName) {
      return NextResponse.json(
        { error: "Template ID and role name are required" },
        { status: 400 }
      );
    }

    await initializeTemplatePolicies(templateId, roleName);

    return NextResponse.json({
      message: "Template applied successfully",
      templateId,
      roleName,
    });
  } catch (error: any) {
    console.error("Error applying template:", error);
    return NextResponse.json(
      { error: "Failed to apply template" },
      { status: 500 }
    );
  }
}

