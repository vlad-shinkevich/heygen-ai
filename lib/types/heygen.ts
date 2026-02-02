// HeyGen API Types

// ============ Avatar Types ============

export interface Avatar {
  avatar_id: string;
  avatar_name: string;
  gender: "male" | "female" | "unknown";
  preview_image_url: string;
  preview_video_url?: string;
  type: "public" | "private" | "custom";
}

export interface AvatarGroup {
  id: string;
  name: string;
  avatars: Avatar[];
}

export interface AvatarListResponse {
  error: null | string;
  data: {
    avatars: Avatar[];
  };
}

export interface AvatarGroupsResponse {
  error: null | string;
  data: {
    avatar_groups: AvatarGroup[];
  };
}

export interface AvatarGroupAvatarsResponse {
  error: null | string;
  data: {
    avatars: Avatar[];
  };
}

// ============ Voice Types ============

export interface Voice {
  voice_id: string;
  name: string;
  language: string;
  gender: "male" | "female" | "unknown";
  preview_audio?: string;
  preview_audio_url?: string; // Alternative field name
  support_pause?: boolean;
  emotion_support?: boolean;
}

export interface VoiceListResponse {
  error: null | string;
  data: {
    voices: Voice[];
  };
}

export interface VoiceLocale {
  locale: string;
  language: string;
}

export interface VoiceLocalesResponse {
  error: null | string;
  data: {
    locales: VoiceLocale[];
  };
}

// ============ Video Generation Types ============

export type VideoInputType = "text" | "audio";

export interface TextInput {
  type: "text";
  input_text: string;
  voice_id: string;
}

export interface AudioInput {
  type: "audio";
  audio_url: string;
}

export type VoiceInput = TextInput | AudioInput;

export interface VideoClip {
  avatar_id: string;
  input_text?: string;
  voice_id?: string;
  audio_url?: string;
  avatar_style?: "normal" | "circle" | "closeUp";
  background?: VideoBackground;
}

export interface VideoBackground {
  type: "color" | "image" | "video";
  value: string; // hex color, image url, or video url
}

export interface VideoGenerationRequest {
  video_inputs: Array<{
    character: {
      type: "avatar";
      avatar_id: string;
      avatar_style?: "normal" | "circle" | "closeUp";
    };
    voice: VoiceInput;
    background?: VideoBackground;
  }>;
  dimension?: {
    width: number;
    height: number;
  };
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  test?: boolean;
  caption?: boolean;
}

export interface VideoGenerationResponse {
  error: null | string;
  data: {
    video_id: string;
  };
}

// ============ Video Status Types ============

export type VideoStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "draft";

export interface VideoStatusResponse {
  error: null | string;
  data: {
    video_id: string;
    status: VideoStatus;
    video_url?: string;
    video_url_caption?: string;
    thumbnail_url?: string;
    duration?: number;
    gif_url?: string;
    error?: string;
    callback_id?: string;
  };
}

// ============ Asset Upload Types ============

export interface AssetUploadResponse {
  error: null | string;
  data: {
    url: string;
  };
}

// ============ User/Quota Types ============

export interface QuotaResponse {
  error: null | string;
  data: {
    remaining_quota: number;
    used_quota: number;
  };
}

// ============ API Error Types ============

export interface HeyGenApiError {
  error: string;
  message?: string;
  code?: number;
}

// ============ App State Types ============

export interface VideoGenerationState {
  selectedAvatar: Avatar | null;
  selectedVoice: Voice | null;
  inputType: VideoInputType;
  inputText: string;
  audioUrl: string | null;
  audioFile: File | null;
  aspectRatio: "16:9" | "9:16" | "1:1";
  avatarStyle: "normal" | "circle" | "closeUp";
  background: VideoBackground;
  isGenerating: boolean;
  currentVideoId: string | null;
  videoStatus: VideoStatus | null;
  videoUrl: string | null;
}

export interface GeneratedVideo {
  video_id: string;
  status: VideoStatus;
  video_url?: string;
  thumbnail_url?: string;
  created_at: string;
}

