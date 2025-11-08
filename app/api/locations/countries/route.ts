import { NextResponse } from "next/server";
import { countries } from "@/lib/countries";

export async function GET() {
  return NextResponse.json({ countries });
}

