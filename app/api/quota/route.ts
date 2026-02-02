import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    const quota = await heygenApi.getQuota();

    // If quota is null (404 or unavailable), return success with null data
    // The UI will handle this gracefully
    return NextResponse.json({
      success: true,
      data: quota,
    });
  } catch (error) {
    console.error("Error fetching quota:", error);
    // Even on error, return success with null to prevent UI breakage
    return NextResponse.json({
      success: true,
      data: null,
    });
  }
}

