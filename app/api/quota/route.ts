import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET() {
  try {
    const quota = await heygenApi.getQuota();

    // If quota is null, return a default response instead of error
    if (quota === null) {
      return NextResponse.json({
        success: true,
        data: {
          remaining: 0,
          used: 0,
        },
        note: "Quota endpoint not available, using default values",
      });
    }

    return NextResponse.json({
      success: true,
      data: quota,
    });
  } catch (error) {
    console.error("Error fetching quota:", error);
    // Return default values instead of error
    return NextResponse.json({
      success: true,
      data: {
        remaining: 0,
        used: 0,
      },
      note: "Quota endpoint error, using default values",
    });
  }
}

