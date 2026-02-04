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

    // Prepare data - always use provided values, use defaults only if undefined
    const settingsData: any = {
      telegram_id: body.telegramId,
      avatar_id: body.avatarId,
      avatar_name: body.avatarName || null,
      voice_id: body.voiceId,
      aspect_ratio: body.aspectRatio !== undefined ? body.aspectRatio : "16:9",
      avatar_style: body.avatarStyle !== undefined ? body.avatarStyle : "normal",
    };

    // Background is JSONB, pass object directly (Supabase will handle it)
    if (body.background) {
      settingsData.background = body.background;
    } else {
      settingsData.background = null;
    }

    console.log("Saving settings:", {
      telegram_id: settingsData.telegram_id,
      avatar_id: settingsData.avatar_id,
      avatar_name: settingsData.avatar_name,
      voice_id: settingsData.voice_id,
      aspect_ratio: settingsData.aspect_ratio,
      avatar_style: settingsData.avatar_style,
      background: settingsData.background,
    });

    // Check if settings exist for this user
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("telegram_id")
      .eq("telegram_id", body.telegramId)
      .single();

    let error;
    let data;

    if (existingSettings) {
      // Update existing record - explicitly update all fields
      const { error: updateError, data: updateData } = await supabase
        .from("user_settings")
        .update({
          avatar_id: settingsData.avatar_id,
          avatar_name: settingsData.avatar_name,
          voice_id: settingsData.voice_id,
          aspect_ratio: settingsData.aspect_ratio,
          avatar_style: settingsData.avatar_style,
          background: settingsData.background,
          updated_at: new Date().toISOString(),
        })
        .eq("telegram_id", body.telegramId)
        .select();
      
      error = updateError;
      data = updateData;
    } else {
      // Insert new record
      const { error: insertError, data: insertData } = await supabase
        .from("user_settings")
        .insert({
          ...settingsData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
      
      error = insertError;
      data = insertData;
    }

    if (error) {
      console.error("Supabase upsert error:", error);
    } else {
      console.log("Settings saved successfully:", data);
    }

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

