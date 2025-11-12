import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "IMPORT"
  | "APPROVE"
  | "REJECT"
  | "VIEW"
  | "SEND"
  | "OTHER";

export type AuditResource =
  | "USER"
  | "DONATION"
  | "EVENT"
  | "ATTENDANCE"
  | "GROUP"
  | "DEPARTMENT"
  | "VOLUNTEER"
  | "COMMUNICATION"
  | "REPORT"
  | "SETTING"
  | "FILE"
  | "OTHER";

export interface AuditLogData {
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    // Check if Activity model exists and has the right structure
    const auditEntry = await prisma.activity.create({
      data: {
        userId: data.userId,
        type: "AUDIT",
        description: `${data.action} ${data.resource}${data.resourceId ? ` (ID: ${data.resourceId})` : ""}: ${data.description}`,
        metadata: {
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          ...data.metadata,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return auditEntry;
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw - audit logging should not break the main flow
    return null;
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: any = {
      type: "AUDIT",
    };

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        take: filters.limit || 100,
        skip: filters.offset || 0,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    // Filter by metadata fields in JavaScript (Prisma JSON filtering is limited)
    let filteredLogs = logs;
    if (filters.action || filters.resource || filters.resourceId) {
      filteredLogs = logs.filter((log) => {
        const metadata = log.metadata as any;
        if (filters.action && metadata?.action !== filters.action) return false;
        if (filters.resource && metadata?.resource !== filters.resource) return false;
        if (filters.resourceId && metadata?.resourceId !== filters.resourceId) return false;
        return true;
      });
    }

    return { logs: filteredLogs, total: filteredLogs.length };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { logs: [], total: 0 };
  }
}

/**
 * Helper to log common actions
 */
export const auditLog = {
  user: {
    created: (userId: string, targetUserId: string, metadata?: Record<string, any>) =>
      createAuditLog({
        userId,
        action: "CREATE",
        resource: "USER",
        resourceId: targetUserId,
        description: "User created",
        metadata,
      }),

    updated: (userId: string, targetUserId: string, metadata?: Record<string, any>) =>
      createAuditLog({
        userId,
        action: "UPDATE",
        resource: "USER",
        resourceId: targetUserId,
        description: "User updated",
        metadata,
      }),

    deleted: (userId: string, targetUserId: string) =>
      createAuditLog({
        userId,
        action: "DELETE",
        resource: "USER",
        resourceId: targetUserId,
        description: "User deleted",
      }),
  },

  donation: {
    created: (userId: string, donationId: string, amount: number) =>
      createAuditLog({
        userId,
        action: "CREATE",
        resource: "DONATION",
        resourceId: donationId,
        description: `Donation created: ${amount}`,
        metadata: { amount },
      }),

    updated: (userId: string, donationId: string, metadata?: Record<string, any>) =>
      createAuditLog({
        userId,
        action: "UPDATE",
        resource: "DONATION",
        resourceId: donationId,
        description: "Donation updated",
        metadata,
      }),
  },

  export: (userId: string, resource: AuditResource, format: string, recordCount?: number) =>
    createAuditLog({
      userId,
      action: "EXPORT",
      resource,
      description: `Exported ${resource} data as ${format.toUpperCase()}${recordCount ? ` (${recordCount} records)` : ""}`,
      metadata: { format, recordCount },
    }),

  login: (userId: string, ipAddress?: string, userAgent?: string) =>
    createAuditLog({
      userId,
      action: "LOGIN",
      resource: "USER",
      resourceId: userId,
      description: "User logged in",
      ipAddress,
      userAgent,
    }),

  logout: (userId: string) =>
    createAuditLog({
      userId,
      action: "LOGOUT",
      resource: "USER",
      resourceId: userId,
      description: "User logged out",
    }),
};

