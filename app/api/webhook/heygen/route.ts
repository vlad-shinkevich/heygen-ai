import { NextResponse } from "next/server";
import {
  getVideoGenerationByVideoId,
  updateVideoGeneration,
  markVideoAsSent,
} from "@/lib/services/video-history";
import { sendVideoToUser } from "@/lib/services/telegram-bot";

/**
 * Webhook endpoint for HeyGen video completion notifications
 * Configure this URL in HeyGen dashboard: https://your-app.vercel.app/api/webhook/heygen
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // HeyGen webhook payload structure may vary
    // Adjust based on actual HeyGen webhook format
    const videoId = body.video_id || body.data?.video_id;
    const status = body.status || body.data?.status;
    const videoUrl = body.video_url || body.data?.video_url;
    const thumbnailUrl = body.thumbnail_url || body.data?.thumbnail_url;
    const error = body.error || body.data?.error;

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "No video_id in webhook payload" },
        { status: 400 }
      );
    }

    // Get video generation record
    const record = await getVideoGenerationByVideoId(videoId);

    if (!record) {
      console.warn(`Video generation record not found for video_id: ${videoId}`);
      return NextResponse.json({
        success: false,
        error: "Video generation record not found",
      });
    }

    // Update status
    const creditsUsed = record.test_mode ? 0 : 1; // Adjust based on your pricing

    await updateVideoGeneration(videoId, {
      status: status as any,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      creditsUsed: status === "completed" ? creditsUsed : 0,
      errorMessage: error,
    });

    // If completed, send to user
    if (status === "completed" && videoUrl && !record.sent_to_telegram) {
      const caption = `🎬 Ваше видео готово!\n\n` +
        `Аватар: ${record.avatar_name || record.avatar_id}\n` +
        `Формат: ${record.aspect_ratio}\n` +
        (record.test_mode ? `⚠️ Тестовый режим (бесплатно)\n` : `💳 Использовано кредитов: ${creditsUsed}\n`);

      const sent = await sendVideoToUser(
        record.telegram_id,
        videoUrl,
        caption
      );

      if (sent) {
        await markVideoAsSent(videoId);
      }
    } else if (status === "failed") {
      // Send error message
      const { sendErrorMessage } = await import("@/lib/services/telegram-bot");
      await sendErrorMessage(
        record.telegram_id,
        `❌ К сожалению, генерация видео не удалась.\n\nОшибка: ${error || "Неизвестная ошибка"}`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Error processing HeyGen webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}

