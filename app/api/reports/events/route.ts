import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";

// GET - Get events report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "month";
    const reportType = searchParams.get("type") || "overview";

    let dateFilter: { gte: Date; lte: Date } | undefined;

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      const now = new Date();
      switch (period) {
        case "month":
          dateFilter = {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          };
          break;
        case "quarter":
          dateFilter = {
            gte: startOfMonth(subMonths(now, 2)),
            lte: endOfMonth(now),
          };
          break;
        case "year":
          dateFilter = {
            gte: startOfYear(now),
            lte: endOfYear(now),
          };
          break;
      }
    }

    const events = await prisma.event.findMany({
      where: dateFilter
        ? {
            startDate: {
              gte: dateFilter.gte,
              lte: dateFilter.lte,
            },
          }
        : undefined,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
        registrations: {
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
        },
        checkIns: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
            checkIns: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Summary statistics
    const totalEvents = events.length;
    const publishedEvents = events.filter((e) => e.status === "PUBLISHED").length;
    const draftEvents = events.filter((e) => e.status === "DRAFT").length;
    const cancelledEvents = events.filter((e) => e.status === "CANCELLED").length;

    const totalRegistrations = events.reduce((sum, e) => sum + e._count.registrations, 0);
    const totalCheckIns = events.reduce((sum, e) => sum + e._count.checkIns, 0);
    const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
    const averageAttendance = totalEvents > 0 ? totalCheckIns / totalEvents : 0;

    // By type
    const byType = events.reduce((acc, event) => {
      const type = event.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          registrations: 0,
          checkIns: 0,
          totalCapacity: 0,
        };
      }
      acc[type].count++;
      acc[type].registrations += event._count.registrations;
      acc[type].checkIns += event._count.checkIns;
      acc[type].totalCapacity += event.capacity || 0;
      return acc;
    }, {} as Record<string, { count: number; registrations: number; checkIns: number; totalCapacity: number }>);

    // By status
    const byStatus = events.reduce((acc, event) => {
      const status = event.status;
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          registrations: 0,
          checkIns: 0,
        };
      }
      acc[status].count++;
      acc[status].registrations += event._count.registrations;
      acc[status].checkIns += event._count.checkIns;
      return acc;
    }, {} as Record<string, { count: number; registrations: number; checkIns: number }>);

    // By campus
    const byCampus = events.reduce((acc, event) => {
      const campus = event.campus?.name || "No Campus";
      if (!acc[campus]) {
        acc[campus] = {
          count: 0,
          registrations: 0,
          checkIns: 0,
        };
      }
      acc[campus].count++;
      acc[campus].registrations += event._count.registrations;
      acc[campus].checkIns += event._count.checkIns;
      return acc;
    }, {} as Record<string, { count: number; registrations: number; checkIns: number }>);

    // Monthly breakdown
    const monthlyBreakdown = events.reduce((acc, event) => {
      const month = format(new Date(event.startDate), "MMM yyyy");
      if (!acc[month]) {
        acc[month] = {
          count: 0,
          registrations: 0,
          checkIns: 0,
        };
      }
      acc[month].count++;
      acc[month].registrations += event._count.registrations;
      acc[month].checkIns += event._count.checkIns;
      return acc;
    }, {} as Record<string, { count: number; registrations: number; checkIns: number }>);

    // Registration analysis
    const eventsWithRegistrations = events.filter((e) => e.requiresRegistration);
    const totalRegistrationsForEvents = eventsWithRegistrations.reduce(
      (sum, e) => sum + e._count.registrations,
      0
    );
    const averageRegistrationsPerEvent =
      eventsWithRegistrations.length > 0
        ? totalRegistrationsForEvents / eventsWithRegistrations.length
        : 0;

    // Accommodation needs
    const accommodationNeeds = events.reduce((acc, event) => {
      const needsAccommodation = event.registrations.filter(
        (r) => r.needsAccommodation
      ).length;
      if (needsAccommodation > 0) {
        acc.total += needsAccommodation;
        acc.eventsWithAccommodation++;
      }
      return acc;
    }, { total: 0, eventsWithAccommodation: 0 });

    // Top events by attendance
    const topEventsByAttendance = events
      .map((event) => ({
        id: event.id,
        title: event.title,
        type: event.type,
        startDate: event.startDate,
        capacity: event.capacity,
        registrations: event._count.registrations,
        checkIns: event._count.checkIns,
        attendanceRate:
          event.capacity && event.capacity > 0
            ? (event._count.checkIns / event.capacity) * 100
            : 0,
        campus: event.campus?.name,
      }))
      .sort((a, b) => b.checkIns - a.checkIns)
      .slice(0, 20);

    // Registration vs Check-in analysis
    const registrationVsCheckIn = events
      .filter((e) => e.requiresRegistration)
      .map((event) => ({
        eventId: event.id,
        eventTitle: event.title,
        registrations: event._count.registrations,
        checkIns: event._count.checkIns,
        noShowRate:
          event._count.registrations > 0
            ? ((event._count.registrations - event._count.checkIns) /
                event._count.registrations) *
              100
            : 0,
      }))
      .sort((a, b) => b.registrations - a.registrations);

    // Paid events analysis
    const paidEvents = events.filter((e) => e.isPaid);
    const totalRevenue = paidEvents.reduce((sum, e) => {
      const price = Number(e.price || 0);
      return sum + price * e._count.registrations;
    }, 0);

    return NextResponse.json({
      reportType: "events",
      period: dateFilter,
      summary: {
        totalEvents,
        publishedEvents,
        draftEvents,
        cancelledEvents,
        totalRegistrations,
        totalCheckIns,
        totalCapacity,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        eventsRequiringRegistration: eventsWithRegistrations.length,
        averageRegistrationsPerEvent: Math.round(averageRegistrationsPerEvent * 100) / 100,
        accommodationNeeds: accommodationNeeds.total,
        eventsWithAccommodation: accommodationNeeds.eventsWithAccommodation,
        paidEvents: paidEvents.length,
        totalRevenue,
      },
      byType: Object.entries(byType).map(([type, data]) => ({
        type,
        count: data.count,
        registrations: data.registrations,
        checkIns: data.checkIns,
        totalCapacity: data.totalCapacity,
        utilizationRate:
          data.totalCapacity > 0 ? (data.checkIns / data.totalCapacity) * 100 : 0,
      })),
      byStatus: Object.entries(byStatus).map(([status, data]) => ({
        status,
        count: data.count,
        registrations: data.registrations,
        checkIns: data.checkIns,
      })),
      byCampus: Object.entries(byCampus).map(([campus, data]) => ({
        campus,
        count: data.count,
        registrations: data.registrations,
        checkIns: data.checkIns,
      })),
      monthlyBreakdown: Object.entries(monthlyBreakdown)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([month, data]) => ({
          month,
          ...data,
        })),
      topEventsByAttendance,
      registrationVsCheckIn,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
        campus: e.campus?.name,
        organizer: e.organizer
          ? `${e.organizer.firstName} ${e.organizer.lastName}`
          : null,
        requiresRegistration: e.requiresRegistration,
        isPaid: e.isPaid,
        price: e.price ? Number(e.price) : null,
        capacity: e.capacity,
        registrations: e._count.registrations,
        checkIns: e._count.checkIns,
        attendanceRate:
          e.capacity && e.capacity > 0
            ? (e._count.checkIns / e.capacity) * 100
            : null,
      })),
    });
  } catch (error: any) {
    console.error("Error generating events report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

