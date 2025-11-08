import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// POST - Automatically assign members to groups based on geographic region
export async function POST(request: NextRequest) {
  try {
    // Check permission using Casbin
    const permissionCheck = await requirePermission("groups", "assign");
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.error?.includes("Unauthorized") ? 401 : 403 }
      );
    }

    const body = await request.json();
    const {
      groupType = "connect-group",
      maxMembersPerGroup = 15,
      regionField = "residence",
      targetGroupIds = [],
    } = body;

    // Get all active members (excluding guests) with full family relationships
    const allMembers = await prisma.user.findMany({
      where: {
        role: { not: "GUEST" },
        status: "ACTIVE",
      },
      include: {
        spouse: {
          select: {
            id: true,
            residence: true,
            county: true,
            city: true,
            role: true,
            status: true,
          },
        },
        parent: {
          select: {
            id: true,
            residence: true,
            county: true,
            city: true,
            role: true,
            status: true,
          },
        },
        children: {
          select: {
            id: true,
            residence: true,
            county: true,
            city: true,
            role: true,
            status: true,
          },
        },
        groupMemberships: {
          where: {
            leftAt: null,
          },
          select: {
            groupId: true,
            group: {
              select: {
                type: true,
              },
            },
          },
        },
      },
    });

    // Get target groups
    let targetGroups = [];
    if (targetGroupIds.length > 0) {
      targetGroups = await prisma.smallGroup.findMany({
        where: {
          id: { in: targetGroupIds },
          type: groupType,
          isActive: true,
        },
        include: {
          members: {
            where: { leftAt: null },
            select: { userId: true },
          },
        },
      });
    } else {
      targetGroups = await prisma.smallGroup.findMany({
        where: {
          type: groupType,
          isActive: true,
        },
        include: {
          members: {
            where: { leftAt: null },
            select: { userId: true },
          },
        },
      });
    }

    if (targetGroups.length === 0) {
      return NextResponse.json(
        { error: `No ${groupType} groups found. Please create groups first.` },
        { status: 400 }
      );
    }

    // Helper function to get region value for a member
    // Normalize the value to ensure consistent matching (case-insensitive, trimmed)
    const getRegionValue = (member: any): string => {
      if (!member) return "unknown";
      
      let value: string | null | undefined;
      switch (regionField) {
        case "residence":
          value = member.residence || member.city || member.county;
          break;
        case "county":
          value = member.county || member.city;
          break;
        case "city":
          value = member.city || member.county;
          break;
        default:
          value = member.residence || member.city || member.county;
      }
      
      // Normalize: ensure we have a string, trim and convert to lowercase
      const normalized = (value || "unknown").toString().trim().toLowerCase();
      return normalized || "unknown";
    };

    // Filter out members already in a group of this type
    const unassignedMembers = allMembers.filter((member) => {
      if (!member || !member.groupMemberships) return true;
      return !member.groupMemberships.some((gm) => gm?.group?.type === groupType);
    });

    // Create a map of all members by ID for quick lookup
    const memberMap = new Map<string, typeof allMembers[0]>();
    for (const member of allMembers) {
      memberMap.set(member.id, member);
    }

    // Build family units - groups of members that must be together
    const familyUnits: Array<Array<string>> = [];
    const processedMemberIds = new Set<string>();

    const buildFamilyUnit = (memberId: string, unit: Set<string>): void => {
      if (processedMemberIds.has(memberId) || unit.has(memberId)) return;

      const member = memberMap.get(memberId);
      if (!member) return;

      // Only include if member is unassigned and active
      const isUnassigned = !member.groupMemberships.some((gm) => gm.group.type === groupType);
      if (!isUnassigned || member.status !== "ACTIVE" || member.role === "GUEST") {
        return;
      }

      unit.add(memberId);
      processedMemberIds.add(memberId);

      const memberRegion = getRegionValue(member);

      // Add spouse if exists and in same region
      if (member.spouse) {
        const spouse = memberMap.get(member.spouse.id);
        if (spouse) {
          const spouseRegion = getRegionValue(spouse);
          const spouseUnassigned = !spouse.groupMemberships.some((gm) => gm.group.type === groupType);
          
          if (
            spouseRegion === memberRegion &&
            spouseUnassigned &&
            spouse.status === "ACTIVE" &&
            spouse.role !== "GUEST" &&
            !processedMemberIds.has(spouse.id)
          ) {
            buildFamilyUnit(spouse.id, unit);
          }
        }
      }

      // Add parent if exists and in same region
      if (member.parent) {
        const parent = memberMap.get(member.parent.id);
        if (parent) {
          const parentRegion = getRegionValue(parent);
          const parentUnassigned = !parent.groupMemberships.some((gm) => gm.group.type === groupType);
          
          if (
            parentRegion === memberRegion &&
            parentUnassigned &&
            parent.status === "ACTIVE" &&
            parent.role !== "GUEST" &&
            !processedMemberIds.has(parent.id)
          ) {
            buildFamilyUnit(parent.id, unit);
          }
        }
      }

      // Add children if in same region
      for (const child of member.children) {
        const childMember = memberMap.get(child.id);
        if (childMember) {
          const childRegion = getRegionValue(childMember);
          const childUnassigned = !childMember.groupMemberships.some((gm) => gm.group.type === groupType);
          
          if (
            childRegion === memberRegion &&
            childUnassigned &&
            childMember.status === "ACTIVE" &&
            childMember.role !== "GUEST" &&
            !processedMemberIds.has(child.id)
          ) {
            buildFamilyUnit(child.id, unit);
          }
        }
      }
    };

    // Build family units for all unassigned members
    for (const member of unassignedMembers) {
      if (processedMemberIds.has(member.id)) continue;

      const unit = new Set<string>();
      buildFamilyUnit(member.id, unit);

      if (unit.size > 0) {
        familyUnits.push(Array.from(unit));
      }
    }

    // Group family units by region for better distribution
    const unitsByRegion = new Map<string, Array<Array<string>>>();
    for (const unit of familyUnits) {
      if (unit.length === 0) continue;
      const firstMember = memberMap.get(unit[0]);
      if (firstMember) {
        const region = getRegionValue(firstMember);
        if (!unitsByRegion.has(region)) {
          unitsByRegion.set(region, []);
        }
        unitsByRegion.get(region)!.push(unit);
      }
    }

    // Initialize group member counts
    const groupMemberCounts = new Map<string, number>();
    for (const group of targetGroups) {
      groupMemberCounts.set(group.id, group.members.length);
    }

    // Assignment algorithm: Best-fit decreasing with family constraints
    const assignments: Array<{ userId: string; groupId: string }> = [];
    const assignmentErrors: string[] = [];

    // Sort family units by size (largest first) to handle big families first
    const sortedUnits = familyUnits.sort((a, b) => b.length - a.length);

    // For each family unit, find the best group
    for (const unit of sortedUnits) {
      const unitSize = unit.length;
      let assigned = false;

      // Try to find a group that can fit the entire unit
      // Sort groups by current capacity (ascending) to balance load
      const availableGroups = targetGroups
        .map((group) => ({
          group,
          currentCount: groupMemberCounts.get(group.id) || 0,
          availableSpace: maxMembersPerGroup - (groupMemberCounts.get(group.id) || 0),
        }))
        .filter((g) => g.availableSpace >= unitSize)
        .sort((a, b) => {
          // Prefer groups with more available space but not too empty (balance)
          const balanceA = a.currentCount / maxMembersPerGroup;
          const balanceB = b.currentCount / maxMembersPerGroup;
          return balanceA - balanceB;
        });

      if (availableGroups.length > 0) {
        // Assign entire unit to the best group
        const targetGroup = availableGroups[0].group;
        for (const userId of unit) {
          assignments.push({
            userId,
            groupId: targetGroup.id,
          });
        }
        groupMemberCounts.set(
          targetGroup.id,
          (groupMemberCounts.get(targetGroup.id) || 0) + unitSize
        );
        assigned = true;
      } else {
        // Can't fit entire unit - try to keep spouses together
        // Split unit: spouses first, then others
        const spouses: string[] = [];
        const others: string[] = [];

        for (const userId of unit) {
          if (!userId) continue;
          const member = memberMap.get(userId);
          if (member?.spouse?.id && unit.includes(member.spouse.id)) {
            if (!spouses.includes(userId)) {
              spouses.push(userId);
            }
          } else {
            others.push(userId);
          }
        }

        // Try to assign spouses together
        if (spouses.length > 0) {
          const spouseGroups = targetGroups
            .map((group) => ({
              group,
              currentCount: groupMemberCounts.get(group.id) || 0,
              availableSpace: maxMembersPerGroup - (groupMemberCounts.get(group.id) || 0),
            }))
            .filter((g) => g.availableSpace >= spouses.length)
            .sort((a, b) => a.currentCount - b.currentCount);

          if (spouseGroups.length > 0) {
            const targetGroup = spouseGroups[0].group;
            for (const userId of spouses) {
              assignments.push({
                userId,
                groupId: targetGroup.id,
              });
            }
            groupMemberCounts.set(
              targetGroup.id,
              (groupMemberCounts.get(targetGroup.id) || 0) + spouses.length
            );
          } else {
            // Can't fit spouses together - assign individually
            others.push(...spouses);
          }
        }

        // Assign remaining members individually
        for (const userId of others) {
          const availableGroups = targetGroups
            .map((group) => ({
              group,
              currentCount: groupMemberCounts.get(group.id) || 0,
              availableSpace: maxMembersPerGroup - (groupMemberCounts.get(group.id) || 0),
            }))
            .filter((g) => g.availableSpace > 0)
            .sort((a, b) => a.currentCount - b.currentCount);

          if (availableGroups.length > 0) {
            const targetGroup = availableGroups[0].group;
            assignments.push({
              userId,
              groupId: targetGroup.id,
            });
            groupMemberCounts.set(
              targetGroup.id,
              (groupMemberCounts.get(targetGroup.id) || 0) + 1
            );
          } else {
            assignmentErrors.push(
              `Could not assign member ${userId} - all groups are full`
            );
          }
        }
      }
    }

    // Execute assignments in a transaction
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Use transaction for better performance and atomicity
    // Only process if we have assignments
    if (assignments.length > 0) {
      try {
        // Process in batches to avoid transaction size limits
        const batchSize = 100;
        for (let i = 0; i < assignments.length; i += batchSize) {
          const batch = assignments.slice(i, i + batchSize);
          await prisma.$transaction(
            batch.map((assignment) =>
              prisma.groupMember.upsert({
                where: {
                  groupId_userId: {
                    groupId: assignment.groupId,
                    userId: assignment.userId,
                  },
                },
                update: {
                  // If already exists, just ensure it's active
                  leftAt: null,
                },
                create: {
                  groupId: assignment.groupId,
                  userId: assignment.userId,
                  role: "member",
                  isLeader: false,
                },
              })
            )
          );
        }
        results.success = assignments.length;
      } catch (error: any) {
        console.error("Transaction error:", error);
        // Fallback to individual assignments
        for (const assignment of assignments) {
          try {
            await prisma.groupMember.upsert({
              where: {
                groupId_userId: {
                  groupId: assignment.groupId,
                  userId: assignment.userId,
                },
              },
              update: {
                leftAt: null,
              },
              create: {
                groupId: assignment.groupId,
                userId: assignment.userId,
                role: "member",
                isLeader: false,
              },
            });
            results.success++;
          } catch (err: any) {
            results.failed++;
            const user = memberMap.get(assignment.userId);
            const userName = user 
              ? `${user.firstName} ${user.lastName}` 
              : assignment.userId;
            results.errors.push(
              `Failed to assign ${userName}: ${err.message || "Unknown error"}`
            );
          }
        }
      }
    }

    // Add assignment errors
    results.errors.push(...assignmentErrors);

    return NextResponse.json({
      message: `Assigned ${results.success} members to groups`,
      success: results.success,
      failed: results.failed,
      errors: results.errors,
      totalAssignments: assignments.length,
      familyUnitsProcessed: familyUnits.length,
      regionsProcessed: unitsByRegion.size,
    });
  } catch (error: any) {
    console.error("Error assigning members to groups:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign members to groups" },
      { status: 500 }
    );
  }
}
