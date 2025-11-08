import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CSVRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  middleName?: string;
  dateOfBirth?: string;
  profession?: string;
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  residence?: string;
  zipCode?: string;
  role?: string;
  status?: string;
  baptismDate?: string;
  dedicationDate?: string;
  weddingAnniversary?: string;
  memberSince?: string;
}

// POST - Bulk create users from CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have at least a header row and one data row" },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
    const dataRows = lines.slice(1);

    // Validate required headers
    const requiredHeaders = ["firstname", "lastname"];
    const missingHeaders = requiredHeaders.filter(
      (h) => !headers.includes(h)
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${missingHeaders.join(", ")}`,
          requiredColumns: requiredHeaders,
        },
        { status: 400 }
      );
    }

    // Parse rows
    const users: CSVRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const values = parseCSVRow(row);
      
      if (values.length !== headers.length) {
        errors.push({
          row: i + 2, // +2 because of header and 0-index
          error: `Column count mismatch. Expected ${headers.length}, got ${values.length}`,
        });
        continue;
      }

      const userData: any = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || "";
        if (value) {
          // Map CSV headers to database fields
          switch (header) {
            case "firstname":
              userData.firstName = value;
              break;
            case "lastname":
              userData.lastName = value;
              break;
            case "email":
              userData.email = value;
              break;
            case "phone":
              userData.phone = value;
              break;
            case "title":
              userData.title = value;
              break;
            case "middlename":
              userData.middleName = value;
              break;
            case "dateofbirth":
            case "dob":
              userData.dateOfBirth = value;
              break;
            case "profession":
              userData.profession = value;
              break;
            case "address":
              userData.address = value;
              break;
            case "city":
              userData.city = value;
              break;
            case "county":
              userData.county = value;
              break;
            case "state":
              userData.state = value;
              break;
            case "country":
              userData.country = value;
              break;
            case "residence":
              userData.residence = value;
              break;
            case "zipcode":
            case "zip":
              userData.zipCode = value;
              break;
            case "role":
              userData.role = value.toUpperCase();
              break;
            case "status":
              userData.status = value.toUpperCase();
              break;
            case "baptismdate":
              userData.baptismDate = value;
              break;
            case "dedicationdate":
              userData.dedicationDate = value;
              break;
            case "weddinganniversary":
              userData.weddingAnniversary = value;
              break;
            case "membersince":
              userData.memberSince = value;
              break;
          }
        }
      });

      // Validate required fields
      if (!userData.firstName || !userData.lastName) {
        errors.push({
          row: i + 2,
          error: "First name and last name are required",
        });
        continue;
      }

      // Validate email format if provided
      if (userData.email && !isValidEmail(userData.email)) {
        errors.push({
          row: i + 2,
          error: `Invalid email format: ${userData.email}`,
        });
        continue;
      }

      // Validate role if provided
      const validRoles = ["GUEST", "MEMBER", "LEADER", "PASTOR", "ADMIN"];
      if (userData.role && !validRoles.includes(userData.role)) {
        errors.push({
          row: i + 2,
          error: `Invalid role: ${userData.role}. Must be one of: ${validRoles.join(", ")}`,
        });
        continue;
      }

      // Validate status if provided
      const validStatuses = ["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED"];
      if (userData.status && !validStatuses.includes(userData.status)) {
        errors.push({
          row: i + 2,
          error: `Invalid status: ${userData.status}. Must be one of: ${validStatuses.join(", ")}`,
        });
        continue;
      }

      users.push(userData);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV validation errors",
          errors,
          validRows: users.length,
        },
        { status: 400 }
      );
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No valid users to import" },
        { status: 400 }
      );
    }

    // Create users in bulk
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; email?: string; phone?: string; error: string }>,
    };

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      
      try {
        // Check for existing user by email or phone
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(userData.email ? [{ email: userData.email }] : []),
              ...(userData.phone ? [{ phone: userData.phone }] : []),
            ],
          },
        });

        if (existingUser) {
          results.skipped++;
          results.errors.push({
            row: i + 2,
            email: userData.email,
            phone: userData.phone,
            error: "User already exists with this email or phone",
          });
          continue;
        }

        // Parse dates
        const dateOfBirth = userData.dateOfBirth
          ? parseDate(userData.dateOfBirth)
          : null;
        const baptismDate = userData.baptismDate
          ? parseDate(userData.baptismDate)
          : null;
        const dedicationDate = userData.dedicationDate
          ? parseDate(userData.dedicationDate)
          : null;
        const weddingAnniversary = userData.weddingAnniversary
          ? parseDate(userData.weddingAnniversary)
          : null;
        const memberSince = userData.memberSince
          ? parseDate(userData.memberSince)
          : null;

        // Create user
        await prisma.user.create({
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email || null,
            phone: userData.phone || null,
            title: userData.title || null,
            middleName: userData.middleName || null,
            dateOfBirth,
            profession: userData.profession || null,
            address: userData.address || null,
            city: userData.city || null,
            county: userData.county || null,
            state: userData.state || null,
            country: userData.country || null,
            residence: userData.residence || null,
            zipCode: userData.zipCode || null,
            role: userData.role || "GUEST",
            status: userData.status || "PENDING",
            baptismDate,
            dedicationDate,
            weddingAnniversary,
            memberSince,
            emailVerified: false,
            phoneVerified: false,
          },
        });

        results.created++;
      } catch (error: any) {
        results.skipped++;
        results.errors.push({
          row: i + 2,
          email: userData.email,
          phone: userData.phone,
          error: error.message || "Failed to create user",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${results.created} users`,
      results,
    });
  } catch (error: any) {
    console.error("Error bulk importing users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import users" },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV row (handles quoted values with commas)
function parseCSVRow(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of value
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current);
  return values;
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to parse date (handles various formats)
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try parsing common date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  ];

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

