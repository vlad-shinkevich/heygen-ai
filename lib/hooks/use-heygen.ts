"use client";

import { useState, useEffect, useCallback } from "react";
import type { Avatar, AvatarGroup, Voice, VideoStatus } from "@/lib/types/heygen";

// ============ Fetch Helpers ============

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, options);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "API request failed");
  }

  return data.data;
}

// ============ Avatar Hooks ============

export function useAvatars() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatars = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // API already returns all data including preview_image_url
      const data = await fetchApi<Avatar[]>("/api/avatars");
      setAvatars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch avatars");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  return { avatars, isLoading, error, refetch: fetchAvatars };
}

export function useAvatarGroups() {
  const [groups, setGroups] = useState<AvatarGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchApi<AvatarGroup[]>("/api/avatar-groups");
      setGroups(data || []); // Ensure it's always an array
    } catch (err) {
      // If avatar groups endpoint is unavailable, use empty array instead of error
      // This allows the app to work without group filtering
      setGroups([]);
      setError(null); // Don't show error for unavailable groups
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, isLoading, error, refetch: fetchGroups };
}

export function useAvatarsInGroup(groupId: string | null) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatars = useCallback(async () => {
    if (!groupId) {
      setAvatars([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchApi<Avatar[]>(`/api/avatar-groups/${groupId}/avatars`);
      setAvatars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch avatars");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  return { avatars, isLoading, error, refetch: fetchAvatars };
}

// ============ Voice Hooks ============

export function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchApi<Voice[]>("/api/voices");
      setVoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch voices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  return { voices, isLoading, error, refetch: fetchVoices };
}

// ============ Video Generation Hooks ============

interface GenerateVideoParams {
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

export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = useCallback(async (params: GenerateVideoParams) => {
    try {
      setIsGenerating(true);
      setError(null);

      await fetchApi<{ message: string }>("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      // Generation request sent to Telegram bot (n8n will process it)
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send generation request";
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateVideo, isGenerating, error };
}

export function useVideoStatus(videoId: string | null) {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!videoId) return null;

    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchApi<{
        video_id: string;
        status: VideoStatus;
        video_url?: string;
        thumbnail_url?: string;
      }>(`/api/video/status/${videoId}`);

      setStatus(data.status);
      if (data.video_url) setVideoUrl(data.video_url);
      if (data.thumbnail_url) setThumbnailUrl(data.thumbnail_url);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to check status";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  // Auto-poll while processing
  useEffect(() => {
    if (!videoId) return;

    // Initial check
    checkStatus();

    // Poll every 5 seconds while not completed/failed
    const interval = setInterval(async () => {
      const data = await checkStatus();
      if (data && (data.status === "completed" || data.status === "failed")) {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [videoId, checkStatus]);

  return { status, videoUrl, thumbnailUrl, isLoading, error, checkStatus };
}

// ============ Upload Hook ============

export function useAudioUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const uploadAudio = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const data = await fetchApi<{ url: string }>("/api/upload", {
        method: "POST",
        body: formData,
      });

      setAudioUrl(data.url);
      return data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload audio";
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAudioUrl(null);
    setError(null);
  }, []);

  return { uploadAudio, isUploading, error, audioUrl, reset };
}

// ============ Quota Hook ============

export function useQuota() {
  const [quota, setQuota] = useState<{ remaining: number; used: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchApi<{ remaining: number; used: number } | null>("/api/quota");
      setQuota(data);
    } catch (err) {
      // If quota endpoint is unavailable, set to null instead of error
      // This allows the app to work without quota display
      setQuota(null);
      setError(null); // Don't show error for unavailable quota
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return { quota, isLoading, error, refetch: fetchQuota };
}

