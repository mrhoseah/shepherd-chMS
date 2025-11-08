import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/casbin";
import { sendBulkSMS } from "@/lib/sms";

// Helper function to replace template variables with member data
function replaceVariables(
  template: string,
  member: {
    firstName: string;
    lastName: string;
    middleName?: string | null;
  }
): string {
  let personalized = template;
  
  // Replace variables
  personalized = personalized.replace(/\{\{firstName\}\}/g, member.firstName);
  personalized = personalized.replace(/\{\{givenName\}\}/g, member.firstName); // givenName is same as firstName
  personalized = personalized.replace(/\{\{lastName\}\}/g, member.lastName);
  personalized = personalized.replace(
    /\{\{fullName\}\}/g,
    `${member.firstName} ${member.lastName}`
  );
  
  // Additional variables
  if (member.middleName) {
    personalized = personalized.replace(/\{\{middleName\}\}/g, member.middleName);
  }
  
  return personalized;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      "communications",
      "create"
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { message, recipientIds, groupIds, manualNumbers } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Collect all recipient IDs
    const allRecipientIds = new Set<string>(recipientIds || []);
    
    // Add group members if groups are selected
    if (groupIds && groupIds.length > 0) {
      const groups = await prisma.smallGroup.findMany({
        where: { id: { in: groupIds } },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  middleName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      groups.forEach((group) => {
        group.members.forEach((member) => {
          if (member.user.phone) {
            allRecipientIds.add(member.user.id);
          }
        });
      });
    }

    // Get all recipients with their data
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: Array.from(allRecipientIds) },
        phone: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
      },
    });

    // Prepare personalized messages
    const messagesToSend = recipients.map((recipient) => ({
      to: recipient.phone!,
      message: replaceVariables(message, recipient),
      recipientId: recipient.id,
    }));

    // Add manual numbers (without personalization)
    if (manualNumbers) {
      const numbers = manualNumbers
        .split(",")
        .map((n: string) => n.trim())
        .filter((n: string) => n.length > 0);
      
      numbers.forEach((number: string) => {
        messagesToSend.push({
          to: number,
          message: message, // No personalization for manual numbers
          recipientId: null,
        });
      });
    }

    // Send SMS via Afrika's Talking API
    const result = await sendBulkSMS(messagesToSend);

    if (result.failed > 0 && result.success === 0) {
      // All failed
      return NextResponse.json(
        { 
          error: `Failed to send SMS messages. ${result.results[0]?.error || "Please check your SMS configuration."}`,
          details: result.results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
      total: messagesToSend.length,
      results: result.results,
    });
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { error: "Failed to send SMS messages" },
      { status: 500 }
    );
  }
}

