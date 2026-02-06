import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get("include_public") === "true";
    
    const groups = await heygenApi.getAvatarGroupsList(includePublic);

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching avatar groups:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch avatar groups",
      },
      { status: 500 }
    );
  }
}

