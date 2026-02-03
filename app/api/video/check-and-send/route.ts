import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";
import {
  getUnsentCompletedVideos,
  updateVideoGeneration,
  markVideoAsSent,
  getVideoGenerationByVideoId,
} from "@/lib/services/video-history";
import { sendVideoToUser, sendErrorMessage } from "@/lib/services/telegram-bot";

/**
 * Check pending videos and send completed ones to Telegram
 * This endpoint should be called periodically (via cron or webhook)
 */
export async function POST(request: Request) {
  try {
    const pendingVideos = await getUnsentCompletedVideos();

    const results = [];

    for (const video of pendingVideos) {
      try {
        // Double-check status with HeyGen API
        const status = await heygenApi.getVideoStatus(video.video_id);

        // Update status in database
        await updateVideoGeneration(video.video_id, {
          status: status.status,
          videoUrl: status.video_url,
          thumbnailUrl: status.thumbnail_url,
          creditsUsed: status.duration ? Math.ceil(status.duration / 60) : 1, // Approximate: 1 credit per minute
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
          await markVideoAsSent(video.video_id); // Mark as "sent" to avoid retrying
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
    });
  } catch (error) {
    console.error("Error checking and sending videos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check videos",
      },
      { status: 500 }
    );
  }
}

/**
 * Check single video status and send if ready
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "videoId is required" },
        { status: 400 }
      );
    }

    const video = await getVideoGenerationByVideoId(videoId);

    if (!video) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    // Check status with HeyGen
    const status = await heygenApi.getVideoStatus(videoId);

    // Update in database
    await updateVideoGeneration(videoId, {
      status: status.status,
      videoUrl: status.video_url,
      thumbnailUrl: status.thumbnail_url,
      creditsUsed: status.duration ? Math.ceil(status.duration / 60) : 1,
    });

    // If completed and not sent, send to Telegram
    if (status.status === "completed" && status.video_url && !video.sent_to_telegram) {
      const caption = `🎬 Ваше видео готово!\n\n` +
        `Аватар: ${video.avatar_name || video.avatar_id}\n` +
        `Тип: ${video.input_type === "text" ? "Текст" : "Аудио"}\n` +
        `Размер: ${video.aspect_ratio}`;

      const sent = await sendVideoToUser(video.telegram_id, status.video_url, caption);

      if (sent) {
        await markVideoAsSent(videoId);
      }

      return NextResponse.json({
        success: true,
        status: status.status,
        sent,
        videoUrl: status.video_url,
      });
    }

    return NextResponse.json({
      success: true,
      status: status.status,
      videoUrl: status.video_url,
      sent: video.sent_to_telegram,
    });
  } catch (error) {
    console.error("Error checking video:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check video",
      },
      { status: 500 }
    );
  }
}

