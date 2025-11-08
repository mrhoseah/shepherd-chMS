import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/casbin";
import { sendBulkEmail } from "@/lib/email";

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
    const { subject, content, recipientIds, groupIds, manualEmails } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Subject and content are required" },
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
                  email: true,
                },
              },
            },
          },
        },
      });

      groups.forEach((group) => {
        group.members.forEach((member) => {
          if (member.user.email) {
            allRecipientIds.add(member.user.id);
          }
        });
      });
    }

    // Get all recipients with their data
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: Array.from(allRecipientIds) },
        email: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
      },
    });

    // Prepare personalized emails
    const emailsToSend = recipients.map((recipient) => ({
      to: recipient.email!,
      subject: replaceVariables(subject, recipient),
      content: replaceVariables(content, recipient),
      recipientId: recipient.id,
    }));

    // Add manual emails (without personalization)
    if (manualEmails) {
      const emails = manualEmails
        .split(",")
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0 && e.includes("@"));
      
      emails.forEach((email: string) => {
        emailsToSend.push({
          to: email,
          subject: subject, // No personalization for manual emails
          content: content, // No personalization for manual emails
          recipientId: null,
        });
      });
    }

    // Send emails via SMTP
    const result = await sendBulkEmail(emailsToSend.map(e => ({
      to: e.to,
      subject: e.subject,
      content: e.content,
    })));

    if (result.failed > 0 && result.success === 0) {
      // All failed
      return NextResponse.json(
        { 
          error: `Failed to send emails. ${result.results[0]?.error || "Please check your email configuration."}`,
          details: result.results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
      total: emailsToSend.length,
      results: result.results,
    });
  } catch (error: any) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}

