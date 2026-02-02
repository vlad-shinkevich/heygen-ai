import { NextResponse } from "next/server";
import {
  getUnsentCompletedVideos,
  markVideoAsSent,
  updateVideoGeneration,
} from "@/lib/services/video-history";
import { sendVideoToUser } from "@/lib/services/telegram-bot";
import { heygenApi } from "@/lib/services/heygen-api";

/**
 * Process completed videos and send them to users
 * This endpoint should be called periodically (via cron or scheduled task)
 * or can be triggered manually
 */
export async function POST(request: Request) {
  try {
    // Get all completed videos that haven't been sent
    const unsentVideos = await getUnsentCompletedVideos();

    if (unsentVideos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unsent videos found",
        processed: 0,
      });
    }

    const results = [];

    for (const video of unsentVideos) {
      try {
        // Double-check video status from HeyGen API
        const status = await heygenApi.getVideoStatus(video.video_id);

        // Update our database with latest status
        await updateVideoGeneration(video.video_id, {
          status: status.status as any,
          videoUrl: status.video_url,
          thumbnailUrl: status.thumbnail_url,
        });

        // Only send if video is actually completed
        if (status.status === "completed" && status.video_url) {
          // Calculate credits used (approximate: 1 credit per video, adjust based on your pricing)
          const creditsUsed = video.test_mode ? 0 : 1;

          // Send video to user
          const caption = `🎬 Ваше видео готово!\n\n` +
            `Аватар: ${video.avatar_name || video.avatar_id}\n` +
            `Формат: ${video.aspect_ratio}\n` +
            (video.test_mode ? `⚠️ Тестовый режим (бесплатно)\n` : `💳 Использовано кредитов: ${creditsUsed}\n`);

          const sent = await sendVideoToUser(
            video.telegram_id,
            status.video_url,
            caption
          );

          if (sent) {
            // Mark as sent and update credits
            await updateVideoGeneration(video.video_id, {
              creditsUsed: creditsUsed,
            });
            await markVideoAsSent(video.video_id);

            results.push({
              videoId: video.video_id,
              telegramId: video.telegram_id,
              status: "sent",
            });
          } else {
            results.push({
              videoId: video.video_id,
              telegramId: video.telegram_id,
              status: "failed_to_send",
            });
          }
        } else if (status.status === "failed") {
          // Update failed status
          await updateVideoGeneration(video.video_id, {
            status: "failed",
            errorMessage: status.error || "Video generation failed",
          });

          // Send error message to user
          const { sendErrorMessage } = await import("@/lib/services/telegram-bot");
          await sendErrorMessage(
            video.telegram_id,
            `❌ К сожалению, генерация видео не удалась.\n\nОшибка: ${status.error || "Неизвестная ошибка"}`
          );

          results.push({
            videoId: video.video_id,
            telegramId: video.telegram_id,
            status: "failed",
          });
        }
      } catch (error) {
        console.error(`Error processing video ${video.video_id}:`, error);
        results.push({
          videoId: video.video_id,
          telegramId: video.telegram_id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error processing completed videos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process videos",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual trigger (for testing)
 */
export async function GET() {
  const result = await POST(new Request("http://localhost", { method: "POST" }));
  return result;
}

