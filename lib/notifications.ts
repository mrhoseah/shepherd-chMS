import { prisma } from "./prisma";

interface CreateNotificationOptions {
  userId: string;
  type: "EMAIL" | "SMS" | "PUSH" | "IN_APP";
  title: string;
  content: string;
  link?: string;
  relatedUserId?: string;
  metadata?: any;
}

type NotificationType = "EMAIL" | "SMS" | "PUSH" | "IN_APP";

/**
 * Create a notification for a user
 */
export async function createNotification(
  options: CreateNotificationOptions
) {
  try {
    return await prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title,
        content: options.content,
        link: options.link,
        relatedUserId: options.relatedUserId,
        metadata: options.metadata || {},
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create notifications for all pastors and leaders when a new guest is registered
 * Also notifies group leaders whose groups have members in the guest's residence
 */
export async function notifyNewGuest(guestId: string) {
  try {
    console.log(`[notifyNewGuest] Starting notification process for guest: ${guestId}`);
    
    // Get guest details including residence
    const guest = await prisma.user.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        residence: true,
        city: true,
        county: true,
        createdAt: true,
      },
    });

    if (!guest) {
      console.error(`[notifyNewGuest] Guest not found: ${guestId}`);
      return;
    }

    console.log(`[notifyNewGuest] Guest found: ${guest.firstName} ${guest.lastName} (${guest.id})`);

    // Get all pastors, leaders, and admins
    const pastorsAndLeaders = await prisma.user.findMany({
      where: {
        role: { in: ["PASTOR", "LEADER", "ADMIN"] },
        status: "ACTIVE",
      },
      select: {
        id: true,
        role: true,
      },
    });

    console.log(`Found ${pastorsAndLeaders.length} pastors/leaders/admins to notify about new guest`);

    // Get group leaders whose groups have members in the guest's residence
    const groupLeaders = new Set<string>();
    
    if (guest.residence || guest.city || guest.county) {
      // Build OR conditions for residence matching (case-insensitive)
      const residenceConditions: any[] = [];
      
      if (guest.residence) {
        residenceConditions.push({
          residence: { contains: guest.residence, mode: "insensitive" },
        });
      }
      if (guest.city) {
        residenceConditions.push({
          city: { contains: guest.city, mode: "insensitive" },
        });
      }
      if (guest.county) {
        residenceConditions.push({
          county: { contains: guest.county, mode: "insensitive" },
        });
      }

      if (residenceConditions.length > 0) {
        // Find groups that have members in the same residence/city/county
        const groupsWithMatchingMembers = await prisma.smallGroup.findMany({
          where: {
            isActive: true,
            members: {
              some: {
                leftAt: null, // Only active members
                user: {
                  status: "ACTIVE",
                  OR: residenceConditions,
                },
              },
            },
          },
          include: {
            members: {
              where: {
                leftAt: null,
                OR: [
                  { isLeader: true },
                  { role: { in: ["leader", "co-leader", "assistant-leader"] } },
                ],
              },
              select: {
                userId: true,
              },
            },
            leader: {
              select: {
                id: true,
              },
            },
          },
        });

        // Collect all group leader IDs
        for (const group of groupsWithMatchingMembers) {
          // Add primary leader if exists
          if (group.leaderId) {
            groupLeaders.add(group.leaderId);
          }
          // Add all members marked as leaders
          for (const member of group.members) {
            groupLeaders.add(member.userId);
          }
        }
      }
    }

    // Combine all users to notify (pastors, leaders, and group leaders)
    const allUsersToNotify = new Set<string>();
    
    // Add pastors and leaders
    for (const user of pastorsAndLeaders) {
      allUsersToNotify.add(user.id);
    }
    
    // Add group leaders (excluding duplicates)
    for (const leaderId of groupLeaders) {
      allUsersToNotify.add(leaderId);
    }

    // Build notification content with residence info
    const residenceInfo = guest.residence 
      ? ` Residence: ${guest.residence}`
      : guest.city 
      ? ` City: ${guest.city}`
      : guest.county
      ? ` County: ${guest.county}`
      : "";

    if (allUsersToNotify.size === 0) {
      console.warn(`No users to notify about new guest: ${guest.firstName} ${guest.lastName}. No active pastors, leaders, or admins found.`);
      return;
    }

    // Create notifications for each user
    const notificationPromises = Array.from(allUsersToNotify).map((userId) =>
      createNotification({
        userId,
        type: "IN_APP",
        title: "New Guest Registered",
        content: `${guest.firstName} ${guest.lastName} has registered as a guest.${residenceInfo}${guest.email ? ` Email: ${guest.email}` : ""}${guest.phone ? ` Phone: ${guest.phone}` : ""}`,
        link: `/dashboard/users/${guest.id}`,
        relatedUserId: guest.id,
        metadata: {
          guestId: guest.id,
          guestName: `${guest.firstName} ${guest.lastName}`,
          registeredAt: guest.createdAt,
          residence: guest.residence,
          city: guest.city,
          county: guest.county,
        },
      }).catch((error) => {
        console.error(`Failed to create notification for user ${userId}:`, error);
        return null;
      })
    );

    const results = await Promise.all(notificationPromises);
    const successful = results.filter(r => r !== null).length;
    const failed = results.filter(r => r === null).length;
    
    console.log(`[notifyNewGuest] Notification creation complete:`);
    console.log(`  - Guest: ${guest.firstName} ${guest.lastName} (${guest.id})`);
    console.log(`  - Pastors/Leaders/Admins found: ${pastorsAndLeaders.length}`);
    console.log(`  - Group leaders found: ${groupLeaders.size}`);
    console.log(`  - Total users to notify: ${allUsersToNotify.size}`);
    console.log(`  - Notifications created: ${successful}`);
    console.log(`  - Notifications failed: ${failed}`);
    
    if (successful > 0) {
      console.log(`[notifyNewGuest] Successfully created ${successful} notification(s)`);
    } else {
      console.warn(`[notifyNewGuest] WARNING: No notifications were created!`);
    }
  } catch (error: any) {
    console.error("[notifyNewGuest] Error notifying about new guest:", error);
    console.error("[notifyNewGuest] Error stack:", error?.stack);
    console.error("[notifyNewGuest] Error details:", JSON.stringify(error, null, 2));
    // Don't throw - we don't want to fail guest registration if notification fails
  }
}

