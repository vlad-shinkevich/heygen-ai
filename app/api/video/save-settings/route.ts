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

    // Log incoming body to see what we receive
    console.log("Received body:", JSON.stringify(body, null, 2));
    console.log("Body values check:", {
      aspectRatio: body.aspectRatio,
      aspectRatioType: typeof body.aspectRatio,
      avatarStyle: body.avatarStyle,
      avatarStyleType: typeof body.avatarStyle,
      background: body.background,
    });

    // Prepare data DIRECTLY from body
    // IMPORTANT: If value is undefined, don't include it in the object
    // This way DB will use DEFAULT, but if value is provided, it will be used
    const dbData: any = {
      telegram_id: body.telegramId,
      avatar_id: body.avatarId,
      avatar_name: body.avatarName || null,
      voice_id: body.voiceId,
    };

    // Only include aspect_ratio if it's provided (not undefined)
    if (body.aspectRatio !== undefined && body.aspectRatio !== null) {
      dbData.aspect_ratio = body.aspectRatio;
    }

    // Only include avatar_style if it's provided (not undefined)
    if (body.avatarStyle !== undefined && body.avatarStyle !== null) {
      dbData.avatar_style = body.avatarStyle;
    }

    // Background
    if (body.background) {
      dbData.background = body.background;
    } else {
      dbData.background = null;
    }

    console.log("DB data prepared (direct from body):", JSON.stringify(dbData, null, 2));
    console.log("Field check:", {
      has_aspect_ratio: 'aspect_ratio' in dbData,
      aspect_ratio_value: dbData.aspect_ratio,
      has_avatar_style: 'avatar_style' in dbData,
      avatar_style_value: dbData.avatar_style,
    });

    // Use upsert to handle both insert and update atomically
    // Build payload - always include all fields we want to set
    const upsertPayload: any = {
      telegram_id: dbData.telegram_id,
      avatar_id: dbData.avatar_id,
      avatar_name: dbData.avatar_name,
      voice_id: dbData.voice_id,
      background: dbData.background,
      updated_at: new Date().toISOString(),
    };
    
    // Only include aspect_ratio if it was in dbData
    if ('aspect_ratio' in dbData) {
      upsertPayload.aspect_ratio = dbData.aspect_ratio;
    }
    
    // Only include avatar_style if it was in dbData
    if ('avatar_style' in dbData) {
      upsertPayload.avatar_style = dbData.avatar_style;
    }

    // Don't set created_at - for new records DB will use DEFAULT NOW()
    // For existing records, created_at will be preserved

    console.log("Upsert payload (before send):", JSON.stringify(upsertPayload, null, 2));
    
    // Use upsert with onConflict on telegram_id
    const result = await supabase
      .from("user_settings")
      .upsert(upsertPayload, {
        onConflict: 'telegram_id',
        ignoreDuplicates: false
      })
      .select();
    
    const error = result.error;
    const data = result.data;
    
    console.log("Upsert result:", { error, data: result.data });
    if (result.data && result.data[0]) {
      console.log("Saved record in DB:", {
        aspect_ratio: result.data[0].aspect_ratio,
        avatar_style: result.data[0].avatar_style,
        background: result.data[0].background,
      });
    }

    if (error) {
      console.error("Supabase error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("Settings saved successfully:", data);
      console.log("Saved aspect_ratio:", data?.[0]?.aspect_ratio);
      console.log("Saved avatar_style:", data?.[0]?.avatar_style);
      console.log("Saved background:", data?.[0]?.background);
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

