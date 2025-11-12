import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Advanced search with multiple filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const types = searchParams.get("types")?.split(",") || ["people", "groups", "events", "donations"];
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const campusId = searchParams.get("campusId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    const results: any = {
      people: [],
      groups: [],
      events: [],
      donations: [],
      departments: [],
    };

    // Build search conditions
    const searchTerm = query ? `%${query}%` : undefined;
    const searchTermLower = query.toLowerCase();

    // Search People
    if (types.includes("people")) {
      const where: any = {};
      
      if (searchTerm) {
        where.OR = [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ];
      }
      
      if (role) where.role = role;
      if (status) where.status = status;
      if (campusId) where.campusId = campusId;

      const people = await prisma.user.findMany({
        where,
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
          campus: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      results.people = people.map((p) => ({
        id: p.id,
        type: "person",
        title: `${p.firstName} ${p.lastName}`,
        subtitle: p.email || p.phone || "No contact",
        description: `${p.role} • ${p.status}`,
        url: `/dashboard/people/${p.id}`,
        metadata: {
          role: p.role,
          status: p.status,
          campus: p.campus?.name,
        },
      }));
    }

    // Search Groups
    if (types.includes("groups")) {
      const where: any = {};
      
      if (searchTerm) {
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ];
      }
      
      if (campusId) where.campusId = campusId;

      const groups = await prisma.smallGroup.findMany({
        where,
        take: limit,
        include: {
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { members: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      results.groups = groups.map((g) => ({
        id: g.id,
        type: "group",
        title: g.name,
        subtitle: g.type || "Group",
        description: g.description || "",
        url: `/dashboard/groups/${g.id}`,
        metadata: {
          type: g.type,
          leader: g.leader ? `${g.leader.firstName} ${g.leader.lastName}` : null,
          memberCount: g._count.members,
        },
      }));
    }

    // Search Events
    if (types.includes("events")) {
      const where: any = {};
      
      if (searchTerm) {
        where.OR = [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ];
      }
      
      if (dateFrom || dateTo) {
        where.startDate = {};
        if (dateFrom) where.startDate.gte = new Date(dateFrom);
        if (dateTo) where.startDate.lte = new Date(dateTo);
      }

      const events = await prisma.event.findMany({
        where,
        take: limit,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { startDate: "desc" },
      });

      results.events = events.map((e) => ({
        id: e.id,
        type: "event",
        title: e.title,
        subtitle: e.eventType || "Event",
        description: e.description || "",
        url: `/dashboard/events/${e.id}`,
        metadata: {
          type: e.eventType,
          startDate: e.startDate,
          organizer: e.organizer ? `${e.organizer.firstName} ${e.organizer.lastName}` : null,
          registrationCount: e._count.registrations,
        },
      }));
    }

    // Search Donations
    if (types.includes("donations")) {
      const where: any = {
        status: "completed",
      };
      
      if (category) where.category = category;
      
      if (minAmount || maxAmount) {
        where.amount = {};
        if (minAmount) where.amount.gte = parseFloat(minAmount);
        if (maxAmount) where.amount.lte = parseFloat(maxAmount);
      }
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const donations = await prisma.donation.findMany({
        where,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      results.donations = donations.map((d) => ({
        id: d.id,
        type: "donation",
        title: `${d.user?.firstName || "Anonymous"} ${d.user?.lastName || ""}`,
        subtitle: d.category,
        description: `KES ${Number(d.amount).toLocaleString()}`,
        url: `/dashboard/donations`,
        metadata: {
          amount: Number(d.amount),
          category: d.category,
          paymentMethod: d.paymentMethod,
          date: d.createdAt,
        },
      }));
    }

    // Search Departments
    if (types.includes("departments")) {
      const where: any = {};
      
      if (searchTerm) {
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ];
      }

      const departments = await prisma.department.findMany({
        where,
        take: limit,
        include: {
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { staff: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      results.departments = departments.map((d) => ({
        id: d.id,
        type: "department",
        title: d.name,
        subtitle: d.isActive ? "Active" : "Inactive",
        description: d.description || "",
        url: `/dashboard/departments`,
        metadata: {
          isActive: d.isActive,
          leader: d.leader ? `${d.leader.firstName} ${d.leader.lastName}` : null,
          staffCount: d._count.staff,
        },
      }));
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce(
      (sum: number, arr: any) => sum + arr.length,
      0
    );

    return NextResponse.json({
      results,
      totalResults,
      query,
      filters: {
        types,
        role,
        status,
        campusId,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        category,
      },
    });
  } catch (error: any) {
    console.error("Error in advanced search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

