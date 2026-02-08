import { NextResponse } from "next/server";
import { heygenApi } from "@/lib/services/heygen-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  
  try {
    const avatars = await heygenApi.getAvatarsInGroup(groupId);

    return NextResponse.json({
      success: true,
      data: avatars,
    });
  } catch (error: any) {
    // Handle 404 errors gracefully - group might be empty or not exist
    if (error?.status === 404) {
      console.warn(`Group ${groupId} not found or empty, returning empty array`);
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    
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

