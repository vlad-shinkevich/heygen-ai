import { NextResponse } from "next/server";

export async function GET() {
  // Avatar groups endpoint is not available, return empty array
  return NextResponse.json({
    success: true,
    data: [],
  });
}

