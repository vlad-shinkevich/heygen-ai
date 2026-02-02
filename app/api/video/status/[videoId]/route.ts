import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const status = await heygenApi.getVideoStatus(videoId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error fetching video status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch video status",
      },
      { status: 500 }
    );
  }
}

