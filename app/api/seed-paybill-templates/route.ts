import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Only allow system admin to seed templates
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Seeding paybill acknowledgement templates...");

    // Check if SMS template already exists
    const existingSMSTemplate = await prisma.messageTemplate.findFirst({
      where: {
        category: "PAYMENT_CONFIRMATION",
        type: "SMS",
        isDefault: true,
      },
    });

    if (!existingSMSTemplate) {
      // Create default SMS template
      await prisma.messageTemplate.create({
        data: {
          name: "Paybill SMS Acknowledgement",
          category: "PAYMENT_CONFIRMATION",
          type: "SMS",
          content: "Thank you {{donorName}}! We have received your offering of KES {{amount}} via M-Pesa ({{transactionId}}). God bless you! - Jericho Temple House of God",
          variables: {
            donorName: "Donor's full name",
            amount: "Donation amount",
            transactionId: "M-Pesa transaction ID",
            date: "Transaction date",
            time: "Transaction time",
            churchName: "Church name"
          },
          isActive: true,
          isDefault: true,
        },
      });
      console.log("✅ Created default SMS template");
    } else {
      console.log("ℹ️ SMS template already exists");
    }

    // Check if email template already exists
    const existingEmailTemplate = await prisma.messageTemplate.findFirst({
      where: {
        category: "PAYMENT_CONFIRMATION",
        type: "EMAIL",
        isDefault: true,
      },
    });

    if (!existingEmailTemplate) {
      // Create default email template
      await prisma.messageTemplate.create({
        data: {
          name: "Paybill Email Receipt",
          category: "PAYMENT_CONFIRMATION",
          type: "EMAIL",
          subject: "Thank You for Your Offering - {{churchName}}",
          content: `Dear {{donorName}},

Thank you for your generous offering to {{churchName}}!

Payment Details:
- Amount: KES {{amount}}
- Transaction ID: {{transactionId}}
- Date: {{date}} at {{time}}
- Payment Method: M-Pesa Paybill

Your donation has been received and recorded in our system. We appreciate your faithfulness and commitment to supporting God's work.

May the Lord bless you abundantly for your generosity!

With gratitude,
{{churchName}}
Pastoral Team`,
          variables: {
            donorName: "Donor's full name",
            amount: "Donation amount",
            transactionId: "M-Pesa transaction ID",
            date: "Transaction date",
            time: "Transaction time",
            churchName: "Church name"
          },
          isActive: true,
          isDefault: true,
        },
      });
      console.log("✅ Created default email template");
    } else {
      console.log("ℹ️ Email template already exists");
    }

    return NextResponse.json({
      success: true,
      message: "Paybill acknowledgement templates seeded successfully!"
    });
  } catch (error: any) {
    console.error("Error seeding templates:", error);
    return NextResponse.json(
      { error: "Failed to seed templates", details: error.message },
      { status: 500 }
    );
  }
}