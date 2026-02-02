import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    const groups = await heygenApi.getAvatarGroups();

    // If no groups found, return empty array instead of error
    return NextResponse.json({
      success: true,
      data: groups || [],
    });
  } catch (error) {
    console.error("Error fetching avatar groups:", error);
    // Return empty array instead of error
    return NextResponse.json({
      success: true,
      data: [],
      note: "Avatar groups endpoint not available",
    });
  }
}

