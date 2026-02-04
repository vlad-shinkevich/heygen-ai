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

    // Check if record exists
    const { data: existing } = await supabase
      .from("user_settings")
      .select("telegram_id")
      .eq("telegram_id", body.telegramId)
      .maybeSingle();

    let error;
    let data;

    if (existing) {
      console.log("Record exists, updating...");
      // UPDATE - build payload from dbData, only include fields that exist
      const updatePayload: any = {
        avatar_id: dbData.avatar_id,
        avatar_name: dbData.avatar_name,
        voice_id: dbData.voice_id,
        background: dbData.background,
        updated_at: new Date().toISOString(),
      };
      
      // Only include aspect_ratio if it was in dbData
      if ('aspect_ratio' in dbData) {
        updatePayload.aspect_ratio = dbData.aspect_ratio;
      }
      
      // Only include avatar_style if it was in dbData
      if ('avatar_style' in dbData) {
        updatePayload.avatar_style = dbData.avatar_style;
      }
      
      console.log("Update payload (before send):", JSON.stringify(updatePayload, null, 2));
      
      const result = await supabase
        .from("user_settings")
        .update(updatePayload)
        .eq("telegram_id", body.telegramId)
        .select();
      
      error = result.error;
      data = result.data;
      console.log("Update result:", { error, data: result.data });
      if (result.data && result.data[0]) {
        console.log("Updated record in DB:", {
          aspect_ratio: result.data[0].aspect_ratio,
          avatar_style: result.data[0].avatar_style,
          background: result.data[0].background,
        });
      }
    } else {
      console.log("Record does not exist, inserting...");
      // INSERT - use dbData directly (it already has only the fields we need)
      const insertPayload: any = {
        ...dbData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log("Insert payload (before send):", JSON.stringify(insertPayload, null, 2));
      
      const result = await supabase
        .from("user_settings")
        .insert(insertPayload)
        .select();
      
      error = result.error;
      data = result.data;
      console.log("Insert result:", { error, data: result.data });
      if (result.data && result.data[0]) {
        console.log("Inserted record in DB:", {
          aspect_ratio: result.data[0].aspect_ratio,
          avatar_style: result.data[0].avatar_style,
          background: result.data[0].background,
        });
      }
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

