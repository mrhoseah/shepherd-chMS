import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

/**
 * NextAuth route handler for App Router
 * Handles all NextAuth API routes: /api/auth/*, /api/auth/signin, etc.
 */
const handler = NextAuth(authOptions);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const resolvedParams = await params;
  return handler(req, { params: resolvedParams });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const resolvedParams = await params;
  return handler(req, { params: resolvedParams });
}
