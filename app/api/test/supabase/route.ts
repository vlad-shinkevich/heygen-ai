import { NextResponse } from "next/server";
import { getSupabaseClient, getAllAllowedUsers } from "@/lib/services/supabase";

export async function GET() {
  try {
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasUrl || !hasKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing environment variables",
          env: {
            hasUrl,
            hasKey,
          },
        },
        { status: 500 }
      );
    }

    // Try to connect to Supabase
    try {
      const client = getSupabaseClient();
      
      // Try to get all users
      const users = await getAllAllowedUsers();

      return NextResponse.json({
        success: true,
        message: "Supabase connection successful",
        usersCount: users.length,
        users: users.map((u) => ({
          id: u.id,
          telegram_id: u.telegram_id,
          username: u.username,
          is_active: u.is_active,
        })),
      });
    } catch (dbError: any) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: dbError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

