import type {
  Avatar,
  AvatarGroup,
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

    const response = await fetch(url, {
      ...options,
      headers: {
        "X-Api-Key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: HeyGenApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || error.message || "Unknown API error");
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
   * Get all avatar groups
   * https://docs.heygen.com/reference/list-all-avatar-groups
   * Endpoint: GET /v2/avatar_group.list
   */
  async getAvatarGroups(): Promise<AvatarGroup[]> {
    const response =
      await this.request<AvatarGroupsResponse>("/v2/avatar_group.list");
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data.avatar_groups;
  }

  /**
   * Get avatars in a specific group
   */
  async getAvatarsInGroup(groupId: string): Promise<Avatar[]> {
    const response = await this.request<AvatarGroupAvatarsResponse>(
      `/v2/avatar_groups/${groupId}/avatars`
    );
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data.avatars;
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
   */
  async getQuota(): Promise<{ remaining: number; used: number }> {
    const response = await this.request<QuotaResponse>(
      "/v1/user/remaining_quota"
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return {
      remaining: response.data.remaining_quota,
      used: response.data.used_quota,
    };
  }
}

// Export singleton instance for server-side use
export const heygenApi = new HeyGenApiService();

// Export class for custom instances
export { HeyGenApiService };

