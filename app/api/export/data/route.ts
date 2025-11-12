import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit-log";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, format = "csv", filters = {} } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Export type is required" },
        { status: 400 }
      );
    }

    let data: any[] = [];
    let headers: string[] = [];
    let filename = "";

    switch (type) {
      case "members":
        const members = await prisma.user.findMany({
          where: filters.where || {},
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            dateOfBirth: true,
            gender: true,
            maritalStatus: true,
            createdAt: true,
          },
        });
        data = members.map((m) => ({
          ID: m.id,
          "First Name": m.firstName,
          "Last Name": m.lastName,
          Email: m.email || "",
          Phone: m.phone || "",
          Role: m.role,
          Status: m.status,
          "Date of Birth": m.dateOfBirth?.toISOString().split("T")[0] || "",
          Gender: m.gender || "",
          "Marital Status": m.maritalStatus || "",
          "Created At": m.createdAt.toISOString().split("T")[0],
        }));
        headers = Object.keys(data[0] || {});
        filename = "members";
        break;

      case "donations":
        const donations = await prisma.donation.findMany({
          where: filters.where || {},
          include: {
            donor: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
        data = donations.map((d) => ({
          ID: d.id,
          Amount: d.amount,
          Currency: d.currency,
          Category: d.category,
          "Payment Method": d.paymentMethod,
          Status: d.status,
          "Donor Name": d.donor
            ? `${d.donor.firstName} ${d.donor.lastName}`
            : "Anonymous",
          "Donor Email": d.donor?.email || "",
          Reference: d.reference || "",
          "Created At": d.createdAt.toISOString().split("T")[0],
        }));
        headers = Object.keys(data[0] || {});
        filename = "donations";
        break;

      case "events":
        const events = await prisma.event.findMany({
          where: filters.where || {},
        });
        data = events.map((e) => ({
          ID: e.id,
          Title: e.title,
          Description: e.description || "",
          "Event Type": e.type,
          Status: e.status,
          "Start Date": e.startDate.toISOString().split("T")[0],
          "End Date": e.endDate?.toISOString().split("T")[0] || "",
          Location: e.location || "",
          Capacity: e.capacity || "",
          "Created At": e.createdAt.toISOString().split("T")[0],
        }));
        headers = Object.keys(data[0] || {});
        filename = "events";
        break;

      case "attendance":
        const attendance = await prisma.attendance.findMany({
          where: filters.where || {},
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            session: {
              select: {
                name: true,
                date: true,
              },
            },
          },
        });
        data = attendance.map((a) => ({
          ID: a.id,
          "Member Name": `${a.user.firstName} ${a.user.lastName}`,
          "Session Name": a.session?.name || "",
          "Session Date": a.session?.date
            ? a.session.date.toISOString().split("T")[0]
            : "",
          Status: a.status,
          "Checked In At": a.checkedInAt?.toISOString() || "",
          "Created At": a.createdAt.toISOString().split("T")[0],
        }));
        headers = Object.keys(data[0] || {});
        filename = "attendance";
        break;

      default:
        return NextResponse.json(
          { error: `Unknown export type: ${type}` },
          { status: 400 }
        );
    }

    // Log the export action
    await auditLog.export(
      session.user.id,
      type.toUpperCase() as any,
      format,
      data.length
    );

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = headers.join(",");
      const csvRows = data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return `"${String(value || "").replace(/"/g, '""')}"`;
          })
          .join(",")
      );
      const csv = [csvHeaders, ...csvRows].join("\n");

      return NextResponse.json({
        success: true,
        format: "csv",
        data: csv,
        filename: `${filename}-${new Date().toISOString().split("T")[0]}.csv`,
        mimeType: "text/csv",
      });
    } else if (format === "excel") {
      // Generate Excel
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: `Unsupported format: ${format}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export data" },
      { status: 500 }
    );
  }
}

