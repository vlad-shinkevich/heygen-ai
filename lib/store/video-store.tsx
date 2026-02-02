"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import type {
  Avatar,
  Voice,
  VideoInputType,
  VideoStatus,
  VideoBackground,
} from "@/lib/types/heygen";

// ============ State Types ============

interface VideoGenerationState {
  // Selection
  selectedAvatar: Avatar | null;
  selectedVoice: Voice | null;
  selectedGroupId: string | null;

  // Input
  inputType: VideoInputType;
  inputText: string;
  audioUrl: string | null;
  audioFileName: string | null;

  // Settings
  aspectRatio: "16:9" | "9:16" | "1:1";
  avatarStyle: "normal" | "circle" | "closeUp";
  background: VideoBackground;
  testMode: boolean;

  // Generation Status
  isGenerating: boolean;
  currentVideoId: string | null;
  videoStatus: VideoStatus | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  generationError: string | null;

  // History
  generatedVideos: Array<{
    videoId: string;
    status: VideoStatus;
    videoUrl?: string;
    thumbnailUrl?: string;
    createdAt: string;
    avatarName: string;
  }>;
}

// ============ Actions ============

type VideoAction =
  | { type: "SET_AVATAR"; payload: Avatar | null }
  | { type: "SET_VOICE"; payload: Voice | null }
  | { type: "SET_GROUP"; payload: string | null }
  | { type: "SET_INPUT_TYPE"; payload: VideoInputType }
  | { type: "SET_INPUT_TEXT"; payload: string }
  | { type: "SET_AUDIO_URL"; payload: { url: string | null; fileName: string | null } }
  | { type: "SET_ASPECT_RATIO"; payload: "16:9" | "9:16" | "1:1" }
  | { type: "SET_AVATAR_STYLE"; payload: "normal" | "circle" | "closeUp" }
  | { type: "SET_BACKGROUND"; payload: VideoBackground }
  | { type: "SET_TEST_MODE"; payload: boolean }
  | { type: "START_GENERATION"; payload: string }
  | { type: "UPDATE_VIDEO_STATUS"; payload: { status: VideoStatus; videoUrl?: string; thumbnailUrl?: string } }
  | { type: "GENERATION_ERROR"; payload: string }
  | { type: "ADD_TO_HISTORY"; payload: { videoId: string; avatarName: string } }
  | { type: "RESET_GENERATION" }
  | { type: "RESET_ALL" };

// ============ Initial State ============

const initialState: VideoGenerationState = {
  selectedAvatar: null,
  selectedVoice: null,
  selectedGroupId: null,
  inputType: "text",
  inputText: "",
  audioUrl: null,
  audioFileName: null,
  aspectRatio: "16:9",
  avatarStyle: "normal",
  background: { type: "color", value: "#ffffff" },
  testMode: false,
  isGenerating: false,
  currentVideoId: null,
  videoStatus: null,
  videoUrl: null,
  thumbnailUrl: null,
  generationError: null,
  generatedVideos: [],
};

// ============ Reducer ============

function videoReducer(state: VideoGenerationState, action: VideoAction): VideoGenerationState {
  switch (action.type) {
    case "SET_AVATAR":
      return { ...state, selectedAvatar: action.payload };

    case "SET_VOICE":
      return { ...state, selectedVoice: action.payload };

    case "SET_GROUP":
      return { ...state, selectedGroupId: action.payload };

    case "SET_INPUT_TYPE":
      return { ...state, inputType: action.payload };

    case "SET_INPUT_TEXT":
      return { ...state, inputText: action.payload };

    case "SET_AUDIO_URL":
      return {
        ...state,
        audioUrl: action.payload.url,
        audioFileName: action.payload.fileName,
      };

    case "SET_ASPECT_RATIO":
      return { ...state, aspectRatio: action.payload };

    case "SET_AVATAR_STYLE":
      return { ...state, avatarStyle: action.payload };

    case "SET_BACKGROUND":
      return { ...state, background: action.payload };

    case "SET_TEST_MODE":
      return { ...state, testMode: action.payload };

    case "START_GENERATION":
      return {
        ...state,
        isGenerating: true,
        currentVideoId: action.payload,
        videoStatus: "pending",
        videoUrl: null,
        thumbnailUrl: null,
        generationError: null,
      };

    case "UPDATE_VIDEO_STATUS":
      return {
        ...state,
        videoStatus: action.payload.status,
        videoUrl: action.payload.videoUrl || state.videoUrl,
        thumbnailUrl: action.payload.thumbnailUrl || state.thumbnailUrl,
        isGenerating: action.payload.status === "processing" || action.payload.status === "pending",
      };

    case "GENERATION_ERROR":
      return {
        ...state,
        isGenerating: false,
        generationError: action.payload,
        videoStatus: "failed",
      };

    case "ADD_TO_HISTORY":
      return {
        ...state,
        generatedVideos: [
          {
            videoId: action.payload.videoId,
            status: state.videoStatus || "pending",
            videoUrl: state.videoUrl || undefined,
            thumbnailUrl: state.thumbnailUrl || undefined,
            createdAt: new Date().toISOString(),
            avatarName: action.payload.avatarName,
          },
          ...state.generatedVideos,
        ].slice(0, 20), // Keep last 20 videos
      };

    case "RESET_GENERATION":
      return {
        ...state,
        isGenerating: false,
        currentVideoId: null,
        videoStatus: null,
        videoUrl: null,
        thumbnailUrl: null,
        generationError: null,
      };

    case "RESET_ALL":
      return initialState;

    default:
      return state;
  }
}

// ============ Context ============

interface VideoContextType {
  state: VideoGenerationState;
  dispatch: React.Dispatch<VideoAction>;
}

const VideoContext = createContext<VideoContextType | null>(null);

// ============ Provider ============

export function VideoStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(videoReducer, initialState);

  return (
    <VideoContext.Provider value={{ state, dispatch }}>
      {children}
    </VideoContext.Provider>
  );
}

// ============ Hook ============

export function useVideoStore() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideoStore must be used within VideoStoreProvider");
  }
  return context;
}

// ============ Action Creators ============

export const videoActions = {
  setAvatar: (avatar: Avatar | null): VideoAction => ({
    type: "SET_AVATAR",
    payload: avatar,
  }),

  setVoice: (voice: Voice | null): VideoAction => ({
    type: "SET_VOICE",
    payload: voice,
  }),

  setGroup: (groupId: string | null): VideoAction => ({
    type: "SET_GROUP",
    payload: groupId,
  }),

  setInputType: (inputType: VideoInputType): VideoAction => ({
    type: "SET_INPUT_TYPE",
    payload: inputType,
  }),

  setInputText: (text: string): VideoAction => ({
    type: "SET_INPUT_TEXT",
    payload: text,
  }),

  setAudioUrl: (url: string | null, fileName: string | null): VideoAction => ({
    type: "SET_AUDIO_URL",
    payload: { url, fileName },
  }),

  setAspectRatio: (ratio: "16:9" | "9:16" | "1:1"): VideoAction => ({
    type: "SET_ASPECT_RATIO",
    payload: ratio,
  }),

  setAvatarStyle: (style: "normal" | "circle" | "closeUp"): VideoAction => ({
    type: "SET_AVATAR_STYLE",
    payload: style,
  }),

  setBackground: (background: VideoBackground): VideoAction => ({
    type: "SET_BACKGROUND",
    payload: background,
  }),

  setTestMode: (enabled: boolean): VideoAction => ({
    type: "SET_TEST_MODE",
    payload: enabled,
  }),

  startGeneration: (videoId: string): VideoAction => ({
    type: "START_GENERATION",
    payload: videoId,
  }),

  updateVideoStatus: (
    status: VideoStatus,
    videoUrl?: string,
    thumbnailUrl?: string
  ): VideoAction => ({
    type: "UPDATE_VIDEO_STATUS",
    payload: { status, videoUrl, thumbnailUrl },
  }),

  setError: (error: string): VideoAction => ({
    type: "GENERATION_ERROR",
    payload: error,
  }),

  addToHistory: (videoId: string, avatarName: string): VideoAction => ({
    type: "ADD_TO_HISTORY",
    payload: { videoId, avatarName },
  }),

  resetGeneration: (): VideoAction => ({
    type: "RESET_GENERATION",
  }),

  resetAll: (): VideoAction => ({
    type: "RESET_ALL",
  }),
};

