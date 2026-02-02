import { NextResponse } from "next/server";
import { getUserVideoHistory } from "@/lib/services/video-history";

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

    const history = await getUserVideoHistory(Number(telegramId));

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching video history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch history",
      },
      { status: 500 }
    );
  }
}
