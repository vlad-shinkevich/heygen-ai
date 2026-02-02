import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";
import { createVideoGeneration } from "@/lib/services/video-history";

interface GenerateVideoRequest {
  telegramId: number;
  avatarId: string;
  avatarName?: string;
  inputType: "text" | "audio";
  text?: string;
  voiceId?: string;
  audioUrl?: string;
  avatarStyle?: "normal" | "circle" | "closeUp";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  background?: {
    type: "color" | "image" | "video";
    value: string;
  };
  test?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: GenerateVideoRequest = await request.json();

    // Validate required fields
    if (!body.telegramId) {
      return NextResponse.json(
        { success: false, error: "Telegram ID is required" },
        { status: 400 }
      );
    }

    if (!body.avatarId) {
      return NextResponse.json(
        { success: false, error: "Avatar ID is required" },
        { status: 400 }
      );
    }

    let videoId: string;

    if (body.inputType === "text") {
      // Validate text input
      if (!body.text || !body.voiceId) {
        return NextResponse.json(
          { success: false, error: "Text and voice ID are required for text input" },
          { status: 400 }
        );
      }

      videoId = await heygenApi.generateVideoWithText({
        avatarId: body.avatarId,
        voiceId: body.voiceId,
        text: body.text,
        avatarStyle: body.avatarStyle,
        aspectRatio: body.aspectRatio,
        background: body.background,
        test: body.test,
      });
    } else if (body.inputType === "audio") {
      // Validate audio input
      if (!body.audioUrl) {
        return NextResponse.json(
          { success: false, error: "Audio URL is required for audio input" },
          { status: 400 }
        );
      }

      videoId = await heygenApi.generateVideoWithAudio({
        avatarId: body.avatarId,
        audioUrl: body.audioUrl,
        avatarStyle: body.avatarStyle,
        aspectRatio: body.aspectRatio,
        background: body.background,
        test: body.test,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid input type. Must be 'text' or 'audio'" },
        { status: 400 }
      );
    }

    // Save to history
    try {
      await createVideoGeneration({
        telegramId: body.telegramId,
        videoId: videoId,
        inputType: body.inputType,
        avatarId: body.avatarId,
        avatarName: body.avatarName,
        voiceId: body.voiceId,
        inputText: body.text,
        audioUrl: body.audioUrl,
        aspectRatio: body.aspectRatio || "16:9",
        avatarStyle: body.avatarStyle || "normal",
        testMode: body.test || false,
      });
    } catch (historyError) {
      console.error("Error saving to history:", historyError);
      // Don't fail the request if history save fails
    }

    return NextResponse.json({
      success: true,
      data: { videoId },
    });
  } catch (error) {
    console.error("Error generating video:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate video",
      },
      { status: 500 }
    );
  }
}

