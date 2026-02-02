import { NextResponse } from "next/server";
import { verifyTelegramWebAppData } from "@/lib/services/telegram-auth";
import { isUserAllowed, updateUserActivity } from "@/lib/services/supabase";
import type { AuthResponse } from "@/lib/types/telegram";

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json<AuthResponse>(
        { authorized: false, error: "No initData provided" },
        { status: 400 }
      );
    }

    // 1. Verify Telegram signature
    const { valid, data } = verifyTelegramWebAppData(initData);

    if (!valid || !data) {
      return NextResponse.json<AuthResponse>(
        { authorized: false, error: "Invalid Telegram data" },
        { status: 401 }
      );
    }

    // 2. Check if user exists in data
    if (!data.user) {
      return NextResponse.json<AuthResponse>(
        { authorized: false, error: "No user data" },
        { status: 401 }
      );
    }

    const telegramId = data.user.id;

    console.log("Verifying access for user:", {
      id: telegramId,
      username: data.user.username,
      firstName: data.user.first_name,
    });

    // 3. Check if user is in allowed list (Supabase)
    const allowed = await isUserAllowed(telegramId);

    console.log("Access check result:", allowed);

    if (!allowed) {
      return NextResponse.json<AuthResponse>(
        {
          authorized: false,
          user: data.user,
          error: "Access denied. You are not in the allowed users list.",
        },
        { status: 403 }
      );
    }

    // 4. Update user activity (optional tracking)
    await updateUserActivity(telegramId);

    // 5. Return success
    return NextResponse.json<AuthResponse>({
      authorized: true,
      user: data.user,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json<AuthResponse>(
      { authorized: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

