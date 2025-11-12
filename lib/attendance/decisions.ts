import { prisma } from "@/lib/prisma";
import { isAfter, isBefore, startOfDay } from "date-fns";

/**
 * New Decisions / Follow-up List
 * Simple query against the Decisions collection, ordered by date and filtered by followUpNeeded: true.
 * This list is the ministry's immediate priority (using Vigilance Red for overdue items).
 */
export async function getDecisionsNeedingFollowUp(): Promise<Array<{
  id: string;
  name: string;
  type: string;
  decisionDate: Date;
  followUpDueDate: Date | null;
  followUpStatus: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  isOverdue: boolean;
  session: {
    id: string;
    name: string | null;
    date: Date;
  } | null;
}>> {
  const decisions = await prisma.decision.findMany({
    where: {
      followUpNeeded: true,
      followUpStatus: {
        not: "COMPLETED",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      session: {
        select: {
          id: true,
          name: true,
          date: true,
        },
      },
    },
    orderBy: {
      decisionDate: "desc",
    },
  });

  const now = new Date();
  const today = startOfDay(now);

  return decisions.map((decision) => {
    const isOverdue =
      decision.followUpDueDate &&
      isBefore(decision.followUpDueDate, today) &&
      decision.followUpStatus !== "COMPLETED";

    return {
      id: decision.id,
      name: decision.user
        ? `${decision.user.firstName} ${decision.user.lastName}`
        : decision.name || "Unknown",
      type: decision.type,
      decisionDate: decision.decisionDate,
      followUpDueDate: decision.followUpDueDate,
      followUpStatus: decision.followUpStatus,
      assignedTo: decision.assignedTo,
      isOverdue,
      session: decision.session,
    };
  });
}

/**
 * Get decision statistics
 */
export async function getDecisionStats(): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  overdue: number;
  completed: number;
  byType: Record<string, number>;
}> {
  const [total, pending, inProgress, overdue, completed, allDecisions] = await Promise.all([
    prisma.decision.count(),
    prisma.decision.count({
      where: {
        followUpNeeded: true,
        followUpStatus: "PENDING",
      },
    }),
    prisma.decision.count({
      where: {
        followUpNeeded: true,
        followUpStatus: "IN_PROGRESS",
      },
    }),
    prisma.decision.count({
      where: {
        followUpNeeded: true,
        followUpStatus: "OVERDUE",
        followUpDueDate: {
          lt: startOfDay(new Date()),
        },
      },
    }),
    prisma.decision.count({
      where: {
        followUpStatus: "COMPLETED",
      },
    }),
    prisma.decision.findMany({
      select: {
        type: true,
      },
    }),
  ]);

  const byType: Record<string, number> = {};
  allDecisions.forEach((decision) => {
    byType[decision.type] = (byType[decision.type] || 0) + 1;
  });

  return {
    total,
    pending,
    inProgress,
    overdue,
    completed,
    byType,
  };
}

