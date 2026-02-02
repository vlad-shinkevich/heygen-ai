import { getSupabaseClient } from "./supabase";

export interface VideoGenerationRecord {
  id: string;
  telegram_id: number;
  video_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  credits_used: number;
  input_type: "text" | "audio";
  avatar_id: string;
  avatar_name?: string;
  voice_id?: string;
  input_text?: string;
  audio_url?: string;
  aspect_ratio: string;
  avatar_style: string;
  test_mode: boolean;
  sent_to_telegram: boolean;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

/**
 * Create a new video generation record
 */
export async function createVideoGeneration(params: {
  telegramId: number;
  videoId: string;
  inputType: "text" | "audio";
  avatarId: string;
  avatarName?: string;
  voiceId?: string;
  inputText?: string;
  audioUrl?: string;
  aspectRatio: string;
  avatarStyle: string;
  testMode: boolean;
}): Promise<VideoGenerationRecord | null> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("video_generations")
      .insert({
        telegram_id: params.telegramId,
        video_id: params.videoId,
        status: "pending",
        input_type: params.inputType,
        avatar_id: params.avatarId,
        avatar_name: params.avatarName,
        voice_id: params.voiceId,
        input_text: params.inputText,
        audio_url: params.audioUrl,
        aspect_ratio: params.aspectRatio,
        avatar_style: params.avatarStyle,
        test_mode: params.testMode,
        credits_used: 0,
        sent_to_telegram: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating video generation record:", error);
      return null;
    }

    return data as VideoGenerationRecord;
  } catch (err) {
    console.error("Error creating video generation:", err);
    return null;
  }
}

/**
 * Update video generation status
 */
export async function updateVideoGeneration(
  videoId: string,
  updates: {
    status?: "pending" | "processing" | "completed" | "failed";
    videoUrl?: string;
    thumbnailUrl?: string;
    creditsUsed?: number;
    errorMessage?: string;
  }
): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    const updateData: any = {
      ...updates,
    };

    if (updates.status === "completed" || updates.status === "failed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await client
      .from("video_generations")
      .update(updateData)
      .eq("video_id", videoId);

    if (error) {
      console.error("Error updating video generation:", error);
      return false;
    }

    // Update credit tracking if credits were used
    if (updates.creditsUsed && updates.creditsUsed > 0) {
      const record = await getVideoGenerationByVideoId(videoId);
      if (record) {
        await updateCreditTracking(record.telegram_id, updates.creditsUsed);
      }
    }

    return true;
  } catch (err) {
    console.error("Error updating video generation:", err);
    return false;
  }
}

/**
 * Get video generation by video_id
 */
export async function getVideoGenerationByVideoId(
  videoId: string
): Promise<VideoGenerationRecord | null> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("video_generations")
      .select("*")
      .eq("video_id", videoId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as VideoGenerationRecord;
  } catch {
    return null;
  }
}

/**
 * Get user's video generation history
 */
export async function getUserVideoHistory(
  telegramId: number,
  limit: number = 50
): Promise<VideoGenerationRecord[]> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("video_generations")
      .select("*")
      .eq("telegram_id", telegramId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as VideoGenerationRecord[];
  } catch {
    return [];
  }
}

/**
 * Get completed videos that haven't been sent to Telegram
 */
export async function getUnsentCompletedVideos(): Promise<
  VideoGenerationRecord[]
> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("video_generations")
      .select("*")
      .eq("status", "completed")
      .eq("sent_to_telegram", false)
      .not("video_url", "is", null)
      .order("completed_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as VideoGenerationRecord[];
  } catch {
    return [];
  }
}

/**
 * Mark video as sent to Telegram
 */
export async function markVideoAsSent(videoId: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from("video_generations")
      .update({ sent_to_telegram: true })
      .eq("video_id", videoId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Update credit tracking for a user
 */
async function updateCreditTracking(
  telegramId: number,
  creditsUsed: number
): Promise<void> {
  try {
    const client = getSupabaseClient();

    // Use the SQL function to update credits
    const { error } = await client.rpc("update_credit_tracking", {
      p_telegram_id: telegramId,
      p_credits_used: creditsUsed,
    });

    if (error) {
      console.error("Error updating credit tracking:", error);
    }
  } catch (err) {
    console.error("Error updating credit tracking:", err);
  }
}

/**
 * Get user's credit statistics
 */
export async function getUserCreditStats(
  telegramId: number
): Promise<{
  totalCreditsUsed: number;
  totalGenerations: number;
  completedGenerations: number;
  failedGenerations: number;
} | null> {
  try {
    const client = getSupabaseClient();

    // Get total credits from credit_tracking
    const { data: creditData } = await client
      .from("credit_tracking")
      .select("total_credits_used")
      .eq("telegram_id", telegramId)
      .single();

    // Get generation stats
    const { data: genData } = await client
      .from("video_generations")
      .select("status, credits_used")
      .eq("telegram_id", telegramId);

    const totalCreditsUsed = creditData?.total_credits_used || 0;
    const totalGenerations = genData?.length || 0;
    const completedGenerations =
      genData?.filter((g) => g.status === "completed").length || 0;
    const failedGenerations =
      genData?.filter((g) => g.status === "failed").length || 0;

    return {
      totalCreditsUsed,
      totalGenerations,
      completedGenerations,
      failedGenerations,
    };
  } catch {
    return null;
  }
}
