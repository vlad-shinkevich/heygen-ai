import { NextResponse } from "next/server";
import {
  getUnsentCompletedVideos,
  updateVideoGeneration,
  markVideoAsSent,
} from "@/lib/services/video-history";
import { heygenApi } from "@/lib/services/heygen-api";
import { sendVideoToUser, sendErrorMessage } from "@/lib/services/telegram-bot";

/**
 * Cron job endpoint to check and send completed videos
 * Set up in Vercel Cron Jobs or external cron service
 * 
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-videos",
 *     "schedule": "*/2 * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingVideos = await getUnsentCompletedVideos();
    const results = [];

    for (const video of pendingVideos) {
      try {
        // Check status with HeyGen API
        const status = await heygenApi.getVideoStatus(video.video_id);

        // Update status in database
        await updateVideoGeneration(video.video_id, {
          status: status.status,
          videoUrl: status.video_url,
          thumbnailUrl: status.thumbnail_url,
          creditsUsed: status.duration ? Math.ceil(status.duration / 60) : 1,
        });

        // If completed, send to Telegram
        if (status.status === "completed" && status.video_url) {
          const caption = `🎬 Ваше видео готово!\n\n` +
            `Аватар: ${video.avatar_name || video.avatar_id}\n` +
            `Тип: ${video.input_type === "text" ? "Текст" : "Аудио"}\n` +
            `Размер: ${video.aspect_ratio}`;

          const sent = await sendVideoToUser(video.telegram_id, status.video_url, caption);

          if (sent) {
            await markVideoAsSent(video.video_id);
            results.push({
              videoId: video.video_id,
              status: "sent",
            });
          } else {
            results.push({
              videoId: video.video_id,
              status: "send_failed",
            });
          }
        } else if (status.status === "failed") {
          // Send error notification
          await sendErrorMessage(
            video.telegram_id,
            status.error || "Неизвестная ошибка"
          );
          await markVideoAsSent(video.video_id);
          results.push({
            videoId: video.video_id,
            status: "failed",
          });
        }
      } catch (error) {
        console.error(`Error processing video ${video.video_id}:`, error);
        results.push({
          videoId: video.video_id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cron job failed",
      },
      { status: 500 }
    );
  }
}

