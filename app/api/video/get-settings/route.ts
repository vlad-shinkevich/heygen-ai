import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/services/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json(
        { success: false, error: "Telegram ID is required" },
        { status: 400 }
      );
    }

    // Get settings from database
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("telegram_id", parseInt(telegramId))
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No settings found
        return NextResponse.json({
          success: true,
          data: null,
        });
      }
      console.error("Error getting settings:", error);
      return NextResponse.json(
        { success: false, error: "Failed to get settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ? {
        avatarId: data.avatar_id,
        avatarName: data.avatar_name,
        voiceId: data.voice_id,
        aspectRatio: data.aspect_ratio,
        avatarStyle: data.avatar_style,
        background: data.background,
      } : null,
    });
  } catch (error) {
    console.error("Error getting settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get settings",
      },
      { status: 500 }
    );
  }
}

