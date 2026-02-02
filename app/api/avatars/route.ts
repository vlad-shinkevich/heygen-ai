import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    // API already returns all data including preview_image_url
    const avatars = await heygenApi.getAvatars();

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

