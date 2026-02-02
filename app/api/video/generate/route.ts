import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

interface GenerateVideoRequest {
  avatarId: string;
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

