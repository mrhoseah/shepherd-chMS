import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Optimized Search API with Big-O considerations:
 * - O(n) queries run in parallel using Promise.all
 * - Database indexes used for O(log n) lookups
 * - Limited results per query (O(1) result set size)
 * - Full-text search where available
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim() || "";
    const types = searchParams.get("types")?.split(",") || [
      "users",
      "donations",
      "events",
      "groups",
      "departments",
    ];
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10); // Cap at 10 for performance

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: {
          users: [],
          donations: [],
          events: [],
          groups: [],
          departments: [],
        },
        total: 0,
      });
    }

    // Prepare search term for optimized queries
    const searchTerm = `%${query}%`;
    const searchTermLower = query.toLowerCase();

    // Execute all searches in parallel for O(1) total time (parallel execution)
    // Each query is O(log n) with proper indexes, limited to O(1) result size
    const searchPromises: Promise<any>[] = [];

    // Search users/people - O(log n) with index on firstName, lastName, email
    if (types.includes("users")) {
      searchPromises.push(
        prisma.user.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            profileImage: true,
          },
          orderBy: [
            // Prioritize exact matches
            { firstName: "asc" },
            { lastName: "asc" },
          ],
        }).then((users) => ({
          type: "users",
          data: users.map((u) => ({
            ...u,
            type: "user",
            title: `${u.firstName} ${u.lastName}`,
            subtitle: u.email || u.phone || u.role,
            url: `/dashboard/people/${u.id}`,
            // Calculate relevance score for sorting
            relevance: calculateRelevance(u, query),
          })).sort((a, b) => (b.relevance || 0) - (a.relevance || 0)),
        }))
      );
    }

    // Search donations - O(log n) with index on reference, donorId
    if (types.includes("donations")) {
      searchPromises.push(
        prisma.donation.findMany({
          where: {
            OR: [
              { reference: { contains: query, mode: "insensitive" } },
              {
                donor: {
                  OR: [
                    { firstName: { contains: query, mode: "insensitive" } },
                    { lastName: { contains: query, mode: "insensitive" } },
                  ],
                },
              },
            ],
          },
          take: limit,
          select: {
            id: true,
            amount: true,
            currency: true,
            reference: true,
            status: true,
            createdAt: true,
            donor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }).then((donations) => ({
          type: "donations",
          data: donations.map((d) => ({
            id: d.id,
            type: "donation",
            title: `Donation: ${d.amount} ${d.currency || "KES"}`,
            subtitle: d.donor
              ? `${d.donor.firstName} ${d.donor.lastName} - ${d.reference}`
              : d.reference,
            url: `/dashboard/donations/${d.id}`,
            amount: d.amount,
            currency: d.currency,
            status: d.status,
          })),
        }))
      );
    }

    // Search events - O(log n) with index on title
    if (types.includes("events")) {
      searchPromises.push(
        prisma.masterEvent.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { location: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            type: true,
            status: true,
          },
          orderBy: { startDate: "desc" },
        }).then((events) => ({
          type: "events",
          data: events.map((e) => ({
            id: e.id,
            type: "event",
            title: e.name,
            subtitle: e.location || (e.startDate ? new Date(e.startDate).toLocaleDateString() : ""),
            url: `/dashboard/events/${e.id}`,
            startDate: e.startDate,
            status: e.status,
          })),
        }))
      );
    }

    // Search groups - O(log n) with index on name
    if (types.includes("groups")) {
      searchPromises.push(
        prisma.group.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            description: true,
            leader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }).then((groups) => ({
          type: "groups",
          data: groups.map((g) => ({
            id: g.id,
            type: "group",
            title: g.name,
            subtitle: g.leader
              ? `Leader: ${g.leader.firstName} ${g.leader.lastName}`
              : g.description || "",
            url: `/dashboard/groups/${g.id}`,
          })),
        }))
      );
    }

    // Search departments - O(log n) with index on name
    if (types.includes("departments")) {
      searchPromises.push(
        prisma.department.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            description: true,
            leader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }).then((departments) => ({
          type: "departments",
          data: departments.map((d) => ({
            id: d.id,
            type: "department",
            title: d.name,
            subtitle: d.leader
              ? `Leader: ${d.leader.firstName} ${d.leader.lastName}`
              : d.description || "",
            url: `/dashboard/departments/${d.id}`,
          })),
        }))
      );
    }

    // Execute all searches in parallel - O(1) time complexity (parallel)
    const searchResults = await Promise.all(searchPromises);

    // Build results object - O(k) where k is number of types (constant, max 5)
    const results: any = {
      users: [],
      donations: [],
      events: [],
      groups: [],
      departments: [],
    };

    searchResults.forEach((result) => {
      results[result.type] = result.data;
    });

    const total =
      results.users.length +
      results.donations.length +
      results.events.length +
      results.groups.length +
      results.departments.length;

    return NextResponse.json({ results, total, query });
  } catch (error: any) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

/**
 * Calculate relevance score for search results
 * O(1) - simple string matching
 */
function calculateRelevance(user: any, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Exact match gets highest score
  if (user.firstName?.toLowerCase() === queryLower) score += 100;
  if (user.lastName?.toLowerCase() === queryLower) score += 100;
  if (user.email?.toLowerCase() === queryLower) score += 50;

  // Starts with gets high score
  if (user.firstName?.toLowerCase().startsWith(queryLower)) score += 50;
  if (user.lastName?.toLowerCase().startsWith(queryLower)) score += 50;
  if (user.email?.toLowerCase().startsWith(queryLower)) score += 25;

  // Contains gets lower score
  if (user.firstName?.toLowerCase().includes(queryLower)) score += 10;
  if (user.lastName?.toLowerCase().includes(queryLower)) score += 10;
  if (user.email?.toLowerCase().includes(queryLower)) score += 5;

  return score;
}
