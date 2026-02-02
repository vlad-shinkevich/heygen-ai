import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    const groups = await heygenApi.getAvatarGroups();

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching avatar groups:", error);
    
    // If endpoint returns 404, it might not be available for this API key
    // Return empty array instead of error to allow app to work without groups
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch avatar groups";
    
    if (errorMessage.includes("404") || errorMessage.includes("NOT FOUND")) {
      console.warn("Avatar groups endpoint not available, returning empty array");
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

