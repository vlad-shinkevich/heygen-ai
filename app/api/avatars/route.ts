import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withDetails = searchParams.get("withDetails") === "true";

    // Use getAvatarsWithDetails if requested, otherwise use regular getAvatars
    const avatars = withDetails
      ? await heygenApi.getAvatarsWithDetails()
      : await heygenApi.getAvatars();

    return NextResponse.json({
      success: true,
      data: avatars,
    });
  } catch (error) {
    console.error("Error fetching avatars:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch avatars",
      },
      { status: 500 }
    );
  }
}

