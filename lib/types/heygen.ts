// ============ Base Types ============

export type VideoStatus = "pending" | "processing" | "completed" | "failed";

export type VideoInputType = "text" | "audio";

export interface VideoBackground {
  type: "color" | "image" | "video";
  value: string;
}

// ============ Avatar Types ============

export interface Avatar {
  avatar_id: string;
  talking_photo_id?: string; // For user-created talking photos
  name?: string;
  avatar_name?: string;
  talking_photo_name?: string; // For user-created talking photos
  preview_image_url?: string;
  preview_video_url?: string;
  avatar_style?: "normal" | "circle" | "closeUp";
  default_voice_id?: string;
  avatar_type?: "avatar" | "talking_photo"; // Type of avatar
  [key: string]: any; // Allow additional properties from API
}

export interface AvatarDetails {
  avatar_id: string;
  preview_image_url?: string;
  preview_video_url?: string;
  [key: string]: any;
}

export interface AvatarGroup {
  id?: string;
  group_id?: string;
  name?: string;
  preview_image?: string;
  group_type?: string;
  train_status?: string;
  default_voice_id?: string;
  num_looks?: number;
  created_at?: number;
  [key: string]: any;
}

// ============ Voice Types ============

export interface Voice {
  voice_id: string;
  name?: string;
  gender?: string;
  locale?: string;
  [key: string]: any;
}

export interface VoiceLocale {
  locale: string;
  name?: string;
  [key: string]: any;
}

// ============ Video Generation Types ============

export interface VideoGenerationRequest {
  video_inputs: Array<{
    character: {
      type: "avatar";
      avatar_id: string;
      avatar_style?: "normal" | "circle" | "closeUp";
    };
    voice: {
      type: "text";
      input_text: string;
      voice_id: string;
    } | {
      type: "audio";
      audio_url: string;
    };
    background?: {
      type: "color" | "image" | "video";
      value: string;
    };
  }>;
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  test?: boolean;
}

export interface VideoStatusData {
  video_id: string;
  status: VideoStatus;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
  [key: string]: any;
}

// ============ API Response Types ============

export interface HeyGenApiError {
  error?: string;
  message?: string;
  [key: string]: any;
}

export interface AvatarListResponse {
  error: null | string;
  data: {
    avatars: Avatar[];
  };
}

export interface AvatarDetailsResponse {
  error: null | string;
  data: AvatarDetails;
}

export interface AvatarGroupsResponse {
  error: null | string;
  data: {
    total_count?: number;
    avatar_group_list: AvatarGroup[];
  };
}

export interface AvatarGroupAvatarsResponse {
  error: null | string;
  data: {
    avatars: Avatar[];
  };
}

export interface VoiceListResponse {
  error: null | string;
  data: {
    voices: Voice[];
  };
}

export interface VoiceLocalesResponse {
  error: null | string;
  data: {
    locales: VoiceLocale[];
  };
}

export interface VideoGenerationResponse {
  error: null | string;
  data: {
    video_id: string;
  };
}

export interface VideoStatusResponse {
  error: null | string;
  data: VideoStatusData;
}

export interface QuotaResponse {
  error: null | string;
  data: {
    remaining_quota: number;
    used_quota: number;
  };
}
