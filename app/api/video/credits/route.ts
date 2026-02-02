import { NextResponse } from "next/server";
import { getUserCreditStats } from "@/lib/services/video-history";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json(
        { success: false, error: "telegramId is required" },
        { status: 400 }
      );
    }

    const stats = await getUserCreditStats(Number(telegramId));

    if (!stats) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching credit stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch credit stats",
      },
      { status: 500 }
    );
  }
}

