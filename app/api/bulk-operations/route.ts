import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and pastors can perform bulk operations
    if (session.user.role !== "ADMIN" && session.user.role !== "PASTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { operation, target, entityType, filters, data } = body;

    if (!operation || !entityType) {
      return NextResponse.json(
        { error: "Operation and entity type are required" },
        { status: 400 }
      );
    }

    let result: any = { success: true, affected: 0 };

    switch (entityType) {
      case "members":
        result = await handleMemberBulkOperation(operation, target, filters, data, session.user.id);
        break;
      case "donations":
        result = await handleDonationBulkOperation(operation, target, filters, data);
        break;
      case "events":
        result = await handleEventBulkOperation(operation, target, filters, data);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid entity type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}

async function handleMemberBulkOperation(
  operation: string,
  target: string,
  filters: any,
  data: any,
  userId: string
) {
  // Build where clause based on target
  let where: any = {};
  
  if (target === "selected" && filters?.ids) {
    where.id = { in: filters.ids };
  } else if (target === "filtered" && filters) {
    if (filters.status) where.status = filters.status;
    if (filters.role) where.role = filters.role;
    if (filters.campusId) where.campusId = filters.campusId;
  }
  // "all" means no additional filters

  let affected = 0;

  switch (operation) {
    case "export":
      const members = await prisma.user.findMany({ where });
      return { success: true, data: members, count: members.length };

    case "status":
      if (!data?.status) {
        throw new Error("Status is required");
      }
      const statusUpdate = await prisma.user.updateMany({
        where,
        data: { status: data.status },
      });
      affected = statusUpdate.count;
      break;

    case "role":
      if (!data?.role) {
        throw new Error("Role is required");
      }
      const roleUpdate = await prisma.user.updateMany({
        where,
        data: { role: data.role },
      });
      affected = roleUpdate.count;
      break;

    case "group":
      if (!data?.groupId) {
        throw new Error("Group ID is required");
      }
      const membersToAdd = await prisma.user.findMany({
        where,
        select: { id: true },
      });
      
      // Add members to group using transaction for better performance
      const groupOperations = membersToAdd.map((member) =>
        prisma.groupMember.upsert({
          where: {
            groupId_userId: {
              userId: member.id,
              groupId: data.groupId,
            },
          },
          create: {
            userId: member.id,
            groupId: data.groupId,
            role: data.role || "member",
            isLeader: false,
          },
          update: {
            role: data.role || "member",
            leftAt: null, // Reactivate if they left
          },
        })
      );
      
      await prisma.$transaction(groupOperations);
      affected = membersToAdd.length;
      break;

    case "tag":
      if (!data?.tag) {
        throw new Error("Tag is required");
      }
      const membersToTag = await prisma.user.findMany({
        where,
        select: { id: true, permissions: true },
      });
      
      for (const member of membersToTag) {
        const currentPermissions = (member.permissions as any) || {};
        const tags = currentPermissions.tags || [];
        if (!tags.includes(data.tag)) {
          tags.push(data.tag);
          await prisma.user.update({
            where: { id: member.id },
            data: {
              permissions: {
                ...currentPermissions,
                tags,
              },
            },
          });
          affected++;
        }
      }
      break;

    case "delete":
      // Only allow deletion of GUEST role members in bulk
      where.role = "GUEST";
      const deleteResult = await prisma.user.deleteMany({ where });
      affected = deleteResult.count;
      break;

    case "campus":
      if (!data?.campusId) {
        throw new Error("Campus ID is required");
      }
      const campusUpdate = await prisma.user.updateMany({
        where,
        data: { campusId: data.campusId },
      });
      affected = campusUpdate.count;
      break;

    case "email":
      // Create message records for bulk email
      const membersForEmail = await prisma.user.findMany({
        where,
        select: { id: true, email: true, firstName: true, lastName: true },
      });
      
      if (data?.templateId || data?.subject) {
        const emailOperations = membersForEmail
          .filter((member) => member.email)
          .map((member) =>
            prisma.message.create({
              data: {
                senderId: userId,
                recipientId: member.id,
                subject: data.subject || "Notification",
                body: data.body || "",
                type: "EMAIL",
                status: "PENDING",
              },
            })
          );
        
        await prisma.$transaction(emailOperations);
        affected = emailOperations.length;
      }
      break;

    case "sms":
      // Create SMS records for bulk SMS
      const membersForSMS = await prisma.user.findMany({
        where,
        select: { id: true, phone: true },
      });
      
      if (data?.message) {
        const smsOperations = membersForSMS
          .filter((member) => member.phone)
          .map((member) =>
            prisma.message.create({
              data: {
                senderId: userId,
                recipientId: member.id,
                subject: "SMS Notification",
                body: data.message,
                type: "SMS",
                status: "PENDING",
              },
            })
          );
        
        await prisma.$transaction(smsOperations);
        affected = smsOperations.length;
      }
      break;

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return { success: true, affected };
}

async function handleDonationBulkOperation(
  operation: string,
  target: string,
  filters: any,
  data: any
) {
  let where: any = {};
  
  if (target === "selected" && filters?.ids) {
    where.id = { in: filters.ids };
  } else if (target === "filtered" && filters) {
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(filters.endDate),
      };
    }
  }

  if (operation === "export") {
    const donations = await prisma.donation.findMany({ where });
    return { success: true, data: donations, count: donations.length };
  }

  return { success: true, affected: 0 };
}

async function handleEventBulkOperation(
  operation: string,
  target: string,
  filters: any,
  data: any
) {
  let where: any = {};
  
  if (target === "selected" && filters?.ids) {
    where.id = { in: filters.ids };
  } else if (target === "filtered" && filters) {
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
  }

  if (operation === "export") {
    const events = await prisma.event.findMany({ where });
    return { success: true, data: events, count: events.length };
  }

  return { success: true, affected: 0 };
}


