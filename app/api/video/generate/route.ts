import { NextResponse } from "next/server";
import { sendGenerationRequest } from "@/lib/services/telegram-bot";

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

    // Validate input type specific fields
    if (body.inputType === "text") {
      if (!body.text || !body.voiceId) {
        return NextResponse.json(
          { success: false, error: "Text and voice ID are required for text input" },
          { status: 400 }
        );
      }
    } else if (body.inputType === "audio") {
      if (!body.audioUrl) {
        return NextResponse.json(
          { success: false, error: "Audio URL is required for audio input" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid input type. Must be 'text' or 'audio'" },
        { status: 400 }
      );
    }

    // Send generation request to Telegram bot (n8n will process it)
    const sent = await sendGenerationRequest(body.telegramId, {
      avatarId: body.avatarId,
      avatarName: body.avatarName,
      voiceId: body.voiceId,
      text: body.text,
      audioUrl: body.audioUrl,
      inputType: body.inputType,
      avatarStyle: body.avatarStyle,
      aspectRatio: body.aspectRatio,
      background: body.background,
      test: body.test,
    });

    if (!sent) {
      return NextResponse.json(
        { success: false, error: "Failed to send generation request to Telegram bot" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Generation request sent to Telegram bot" },
    });
  } catch (error) {
    console.error("Error sending generation request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send generation request",
      },
      { status: 500 }
    );
  }
}

