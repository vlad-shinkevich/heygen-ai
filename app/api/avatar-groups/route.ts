import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    const groups = await heygenApi.getAvatarGroups();

    // getAvatarGroups already handles 404 and returns empty array
    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching avatar groups:", error);
    
    // Even on unexpected errors, return empty array to prevent UI breakage
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

