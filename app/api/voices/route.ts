import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    const voices = await heygenApi.getVoices();

    return NextResponse.json({
      success: true,
      data: voices,
    });
  } catch (error) {
    console.error("Error fetching voices:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch voices",
      },
      { status: 500 }
    );
  }
}

