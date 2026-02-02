import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    const quota = await heygenApi.getQuota();

    return NextResponse.json({
      success: true,
      data: quota,
    });
  } catch (error) {
    console.error("Error fetching quota:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch quota",
      },
      { status: 500 }
    );
  }
}

