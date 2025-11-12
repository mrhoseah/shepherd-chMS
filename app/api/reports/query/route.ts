import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Execute SQL query (with safety restrictions)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // Security: Only allow SELECT queries
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith("SELECT")) {
      return NextResponse.json(
        { error: "Only SELECT queries are allowed" },
        { status: 400 }
      );
    }

    // Security: Block dangerous keywords
    const dangerousKeywords = [
      "DROP",
      "DELETE",
      "UPDATE",
      "INSERT",
      "ALTER",
      "CREATE",
      "TRUNCATE",
      "EXEC",
      "EXECUTE",
    ];
    for (const keyword of dangerousKeywords) {
      if (trimmedQuery.includes(keyword)) {
        return NextResponse.json(
          { error: `Query contains forbidden keyword: ${keyword}` },
          { status: 400 }
        );
      }
    }

    // Execute query using Prisma's raw query
    // Note: This is a simplified implementation. In production, you'd want more sophisticated query parsing
    try {
      const results = await prisma.$queryRawUnsafe(query);
      return NextResponse.json({ results });
    } catch (error: any) {
      console.error("Query execution error:", error);
      return NextResponse.json(
        { error: error.message || "Query execution failed" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error in query endpoint:", error);
    return NextResponse.json(
      { error: "Failed to execute query" },
      { status: 500 }
    );
  }
}

