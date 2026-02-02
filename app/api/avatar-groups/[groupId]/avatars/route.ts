import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const avatars = await heygenApi.getAvatarsInGroup(groupId);

    return NextResponse.json({
      success: true,
      data: avatars,
    });
  } catch (error) {
    console.error("Error fetching avatars in group:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch avatars",
      },
      { status: 500 }
    );
  }
}

