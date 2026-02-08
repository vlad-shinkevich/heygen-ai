import type {
  Avatar,
  AvatarGroup,
  AvatarDetails,
  AvatarDetailsResponse,
  AvatarListResponse,
  AvatarGroupsResponse,
  AvatarGroupAvatarsResponse,
  Voice,
  VoiceListResponse,
  VoiceLocale,
  VoiceLocalesResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoStatusResponse,
  QuotaResponse,
  HeyGenApiError,
} from "@/lib/types/heygen";

const HEYGEN_API_BASE_URL =
  process.env.HEYGEN_API_BASE_URL || "https://api.heygen.com";

class HeyGenApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HEYGEN_API_KEY || "";
    this.baseUrl = HEYGEN_API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log("HeyGen API Request:", url);

    // Build headers according to HeyGen API documentation
    // Start with required headers, then merge user-provided headers
    const headers = new Headers();
    
    // Set required headers first
    headers.set("accept", "application/json");
    headers.set("x-api-key", this.apiKey);
    console.log("HeyGen API Headers:", {
      accept: headers.get("accept"),
      "x-api-key": headers.get("x-api-key") ? "***" : "MISSING"
    });

    // Merge user-provided headers (they can override if needed)
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers.set(key, value);
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers.set(key, value);
        });
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value) {
            headers.set(key, String(value));
          }
        });
      }
    }

    // Add Content-Type only for POST/PUT/PATCH requests
    const method = options.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // For 404, don't try to parse JSON - just return error info
      if (response.status === 404) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = 404;
        throw error;
      }
      
      let errorMessage: string;
      try {
        const error: HeyGenApiError = await response.json();
        errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  // ============ Avatar Methods ============

  /**
   * Get all available avatars
   * https://docs.heygen.com/reference/list-avatars-v2
   */
  async getAvatars(): Promise<Avatar[]> {
    const response = await this.request<AvatarListResponse>("/v2/avatars");
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data.avatars;
  }

  /**
   * Get avatar details with preview images
   * https://docs.heygen.com/reference/retrieve-avatar-details
   * Endpoint: GET /v2/avatar/{avatar_id}/details
   */
  async getAvatarDetails(avatarId: string): Promise<AvatarDetails> {
    const response = await this.request<AvatarDetailsResponse>(
      `/v2/avatar/${avatarId}/details`
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data;
  }

  /**
   * Get avatars with details (preview images)
   * Fetches list and then gets details for avatars missing preview_image_url
   * Uses batch processing to avoid overwhelming the API
   */
  async getAvatarsWithDetails(): Promise<Avatar[]> {
    const avatars = await this.getAvatars();
    
    // Filter avatars that need details
    const avatarsNeedingDetails = avatars.filter(
      (avatar) => !avatar.preview_image_url
    );
    
    // If all avatars already have preview, return early
    if (avatarsNeedingDetails.length === 0) {
      return avatars;
    }

    // Process in batches of 10 to avoid rate limiting
    const batchSize = 10;
    const batches: Avatar[][] = [];
    for (let i = 0; i < avatarsNeedingDetails.length; i += batchSize) {
      batches.push(avatarsNeedingDetails.slice(i, i + batchSize));
    }

    const detailsMap = new Map<string, AvatarDetails>();

    // Process batches sequentially
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((avatar) => this.getAvatarDetails(avatar.avatar_id))
      );

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          detailsMap.set(batch[index].avatar_id, result.value);
        }
      });
    }

    // Merge details back into avatars
    return avatars.map((avatar) => {
      const details = detailsMap.get(avatar.avatar_id);
      if (details) {
        return {
          ...avatar,
          preview_image_url: details.preview_image_url || avatar.preview_image_url,
          preview_video_url: details.preview_video_url || avatar.preview_video_url,
        };
      }
      return avatar;
    });
  }


  /**
   * Get avatar groups list (user-created avatars)
   * https://docs.heygen.com/reference/list-all-avatar-groups
   * Endpoint: GET /v2/avatar_group.list
   */
  async getAvatarGroupsList(includePublic: boolean = false): Promise<AvatarGroup[]> {
    const response = await this.request<AvatarGroupsResponse>(
      `/v2/avatar_group.list?include_public=${includePublic}`
    );
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data.avatar_group_list;
  }

  /**
   * Get avatars in a specific group
   */
  async getAvatarsInGroup(groupId: string): Promise<Avatar[]> {
    try {
      const response = await this.request<AvatarGroupAvatarsResponse>(
        `/v2/avatar_groups/${groupId}/avatars`
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data.avatars;
    } catch (error: any) {
      // Handle 404 for empty or non-existent groups
      if (error?.status === 404 || error?.message?.includes('404')) {
        console.warn(`Group ${groupId} not found or empty`);
        return [];
      }
      throw error;
    }
  }

  // ============ Voice Methods ============

  /**
   * Get all available voices
   * https://docs.heygen.com/reference/list-voices-v2
   * Endpoint: GET /v2/voices
   */
  async getVoices(): Promise<Voice[]> {
    const response = await this.request<VoiceListResponse>("/v2/voices");
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data.voices;
  }

  /**
   * Get all supported voice locales
   */
  async getVoiceLocales(): Promise<VoiceLocale[]> {
    const response =
      await this.request<VoiceLocalesResponse>("/v1/voice.locales");
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data.locales;
  }

  // ============ Video Generation Methods ============

  /**
   * Generate a video with text input
   * https://docs.heygen.com/reference/create-an-avatar-video-v2
   * Endpoint: POST /v2/video/generate
   */
  async generateVideoWithText(params: {
    avatarId: string;
    voiceId: string;
    text: string;
    avatarStyle?: "normal" | "circle" | "closeUp";
    aspectRatio?: "16:9" | "9:16" | "1:1";
    background?: { type: "color" | "image" | "video"; value: string };
    test?: boolean;
  }): Promise<string> {
    const request: VideoGenerationRequest = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: params.avatarId,
            avatar_style: params.avatarStyle || "normal",
          },
          voice: {
            type: "text",
            input_text: params.text,
            voice_id: params.voiceId,
          },
          background: params.background,
        },
      ],
      aspect_ratio: params.aspectRatio || "16:9",
      test: params.test ?? false,
    };

    const response = await this.request<VideoGenerationResponse>(
      "/v2/video/generate",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data.video_id;
  }

  /**
   * Generate a video with audio input
   * https://docs.heygen.com/reference/create-an-avatar-video-v2
   * Endpoint: POST /v2/video/generate
   */
  async generateVideoWithAudio(params: {
    avatarId: string;
    audioUrl: string;
    avatarStyle?: "normal" | "circle" | "closeUp";
    aspectRatio?: "16:9" | "9:16" | "1:1";
    background?: { type: "color" | "image" | "video"; value: string };
    test?: boolean;
  }): Promise<string> {
    const request: VideoGenerationRequest = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: params.avatarId,
            avatar_style: params.avatarStyle || "normal",
          },
          voice: {
            type: "audio",
            audio_url: params.audioUrl,
          },
          background: params.background,
        },
      ],
      aspect_ratio: params.aspectRatio || "16:9",
      test: params.test ?? false,
    };

    const response = await this.request<VideoGenerationResponse>(
      "/v2/video/generate",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data.video_id;
  }

  /**
   * Get video generation status
   * https://docs.heygen.com/reference/video-status
   * Endpoint: GET /v1/video_status.get?video_id={video_id}
   */
  async getVideoStatus(videoId: string): Promise<VideoStatusResponse["data"]> {
    const response = await this.request<VideoStatusResponse>(
      `/v1/video_status.get?video_id=${videoId}`
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  /**
   * List all assets
   * https://docs.heygen.com/reference/list-assets
   * Endpoint: GET /v1/asset
   */
  async listAssets(): Promise<any[]> {
    const response = await this.request<{ error: null | string; data: { assets: any[] } }>(
      "/v1/asset"
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data.assets;
  }

  // ============ Asset Methods ============

  /**
   * Upload an asset (audio file) and get URL
   * https://docs.heygen.com/reference/upload-asset
   * Endpoint: POST https://upload.heygen.com/v1/asset
   * Returns asset URL for use in video generation
   */
  async uploadAsset(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    // Upload endpoint is on different domain
    const uploadUrl = "https://upload.heygen.com/v1/asset";

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
      }));
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    // Response format: { data: { url: string } }
    return data.data.url;
  }

  // ============ User Methods ============

  /**
   * Get remaining quota
   * https://docs.heygen.com/reference/get-remaining-quota-v2
   * Endpoint: GET /v2/user/remaining_quota
   * 
   * Converts quota to credits by dividing by 60 (as per HeyGen API documentation)
   */
  async getQuota(): Promise<{ remaining: number; used: number } | null> {
    try {
      const response = await this.request<QuotaResponse>("/v2/user/remaining_quota");

      if (response.error) {
        console.warn("Quota endpoint returned error:", response.error);
        return null;
      }

      // Convert quota to credits: divide by 60
      // https://docs.heygen.com/reference/get-remaining-quota-v2
      return {
        remaining: Math.floor(response.data.remaining_quota / 60),
        used: Math.floor(response.data.used_quota / 60),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // If 404, endpoint might not be available for this API key/tier
      if (errorMessage.includes("404") || errorMessage.includes("NOT FOUND")) {
        console.warn("Quota endpoint not available (404), returning null");
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  }
}

// Export singleton instance for server-side use
export const heygenApi = new HeyGenApiService();

// Export class for custom instances
export { HeyGenApiService };

