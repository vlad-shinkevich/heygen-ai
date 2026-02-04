import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/services/supabase";

interface SaveSettingsRequest {
  telegramId: number;
  avatarId: string;
  avatarName?: string;
  voiceId: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  avatarStyle?: "normal" | "circle" | "closeUp";
  background?: {
    type: "color" | "image" | "video";
    value: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: SaveSettingsRequest = await request.json();

    // Validate required fields
    if (!body.telegramId) {
      return NextResponse.json(
        { success: false, error: "Telegram ID is required" },
        { status: 400 }
      );
    }

    if (!body.avatarId || !body.voiceId) {
      return NextResponse.json(
        { success: false, error: "Avatar ID and Voice ID are required" },
        { status: 400 }
      );
    }

    // Save settings to Supabase
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("user_settings")
      .upsert(
        {
          telegram_id: body.telegramId,
          avatar_id: body.avatarId,
          avatar_name: body.avatarName,
          voice_id: body.voiceId,
          aspect_ratio: body.aspectRatio || "16:9",
          avatar_style: body.avatarStyle || "normal",
          background: body.background ? JSON.stringify(body.background) : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "telegram_id",
        }
      );

    if (error) {
      console.error("Error saving settings to Supabase:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save settings to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Settings saved successfully" },
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save settings",
      },
      { status: 500 }
    );
  }
}

