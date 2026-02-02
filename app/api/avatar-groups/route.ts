import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    const groups = await heygenApi.getAvatarGroups();
    return NextResponse.json({
      success: true,
      data: groups || [],
    });
  } catch (error) {
    // Fallback - return empty array
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

