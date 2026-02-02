"use client";

import { useEffect, useState } from "react";
import { useTelegram, useTelegramHaptic } from "@/lib/hooks/use-telegram";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useAvatars,
  useAvatarGroups,
  useAvatarsInGroup,
  useVoices,
  useVideoGeneration,
  useVideoStatus,
  useAudioUpload,
  useQuota,
} from "@/lib/hooks/use-heygen";
import { useVideoStore, videoActions } from "@/lib/store/video-store";
import type { Avatar, Voice } from "@/lib/types/heygen";

// Components
import { AvatarSelector } from "@/components/avatar-selector";
import { VoiceSelector } from "@/components/voice-selector";
import { TextInput } from "@/components/text-input";
import { AudioUpload } from "@/components/audio-upload";
import { VideoSettings } from "@/components/video-settings";
import { VideoPreview } from "@/components/video-preview";
import { GenerateButton } from "@/components/generate-button";
import { QuotaDisplay } from "@/components/quota-display";

export default function Home() {
  const { isReady, isTelegram, colorScheme } = useTelegram();
  const { user } = useAuth();
  const haptic = useTelegramHaptic();
  const { state, dispatch } = useVideoStore();

  // API Hooks
  const { avatars, isLoading: avatarsLoading, error: avatarsError } = useAvatars();
  const { groups, isLoading: groupsLoading } = useAvatarGroups();
  const { avatars: groupAvatars, isLoading: groupAvatarsLoading } = useAvatarsInGroup(
    state.selectedGroupId
  );
  const { voices, isLoading: voicesLoading, error: voicesError } = useVoices();
  const { quota, refetch: refetchQuota } = useQuota();
  const { generateVideo, isGenerating, error: generateError } = useVideoGeneration();
  const { uploadAudio, isUploading, audioUrl: uploadedAudioUrl } = useAudioUpload();
  const { status, videoUrl, thumbnailUrl } = useVideoStatus(state.currentVideoId);

  // Update video status in store
  useEffect(() => {
    if (status) {
      dispatch(videoActions.updateVideoStatus(status, videoUrl || undefined, thumbnailUrl || undefined));
    }
  }, [status, videoUrl, thumbnailUrl, dispatch]);

  // Combine all avatars (either from selected group or all avatars)
  const displayAvatars = state.selectedGroupId ? groupAvatars : avatars;
  const isLoadingAvatars = state.selectedGroupId ? groupAvatarsLoading : avatarsLoading;

  // Handle avatar selection
  const handleAvatarSelect = (avatar: Avatar) => {
    haptic.selection();
    dispatch(videoActions.setAvatar(avatar));
  };

  // Handle voice selection
  const handleVoiceSelect = (voice: Voice) => {
    haptic.selection();
    dispatch(videoActions.setVoice(voice));
  };

  // Handle group selection
  const handleGroupSelect = (groupId: string | null) => {
    haptic.selection();
    dispatch(videoActions.setGroup(groupId));
    dispatch(videoActions.setAvatar(null)); // Reset avatar when changing group
  };

  // Handle text input
  const handleTextChange = (text: string) => {
    dispatch(videoActions.setInputText(text));
  };

  // Handle audio upload
  const handleAudioUpload = async (file: File) => {
    try {
      const url = await uploadAudio(file);
      dispatch(videoActions.setAudioUrl(url, file.name));
      haptic.notification("success");
    } catch {
      haptic.notification("error");
    }
  };

  // Handle audio remove
  const handleAudioRemove = () => {
    dispatch(videoActions.setAudioUrl(null, null));
  };

  // Handle input type change
  const handleInputTypeChange = (type: "text" | "audio") => {
    haptic.selection();
    dispatch(videoActions.setInputType(type));
  };

  // Handle generate
  const handleGenerate = async () => {
    if (!state.selectedAvatar) {
      haptic.notification("error");
      return;
    }

    if (!user?.id) {
      haptic.notification("error");
      return;
    }

    if (state.inputType === "text" && (!state.inputText || !state.selectedVoice)) {
      haptic.notification("error");
      return;
    }

    if (state.inputType === "audio" && !state.audioUrl) {
      haptic.notification("error");
      return;
    }

    try {
      haptic.impact("medium");

      const videoId = await generateVideo({
        telegramId: user.id,
        avatarId: state.selectedAvatar.avatar_id,
        avatarName: state.selectedAvatar.avatar_name,
        inputType: state.inputType,
        text: state.inputType === "text" ? state.inputText : undefined,
        voiceId: state.inputType === "text" ? state.selectedVoice?.voice_id : undefined,
        audioUrl: state.inputType === "audio" ? state.audioUrl || undefined : undefined,
        avatarStyle: state.avatarStyle,
        aspectRatio: state.aspectRatio,
        background: state.background,
        test: state.testMode,
      });

      dispatch(videoActions.startGeneration(videoId));
      dispatch(videoActions.addToHistory(videoId, state.selectedAvatar.avatar_name));
      haptic.notification("success");
      refetchQuota();
    } catch {
      haptic.notification("error");
      dispatch(videoActions.setError(generateError || "Failed to generate video"));
    }
  };

  // Polling for video status and auto-send
  useEffect(() => {
    if (!state.currentVideoId || !user?.id) return;

    const checkAndSend = async () => {
      try {
        const response = await fetch(
          `/api/video/check-and-send?videoId=${state.currentVideoId}`
        );
        const data = await response.json();

        if (data.success && data.status === "completed" && data.sent) {
          // Video was sent to Telegram
          dispatch(videoActions.updateVideoStatus("completed", data.videoUrl));
          haptic.notification("success");
        } else if (data.status) {
          dispatch(videoActions.updateVideoStatus(data.status, data.videoUrl));
        }
      } catch (error) {
        console.error("Error checking video status:", error);
      }
    };

    // Check immediately
    checkAndSend();

    // Poll every 10 seconds while processing
    const interval = setInterval(() => {
      if (state.videoStatus === "pending" || state.videoStatus === "processing") {
        checkAndSend();
      } else {
        clearInterval(interval);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [state.currentVideoId, state.videoStatus, user?.id, dispatch, haptic]);

  // Check if generation is possible
  const canGenerate =
    state.selectedAvatar &&
    ((state.inputType === "text" && state.inputText.trim() && state.selectedVoice) ||
      (state.inputType === "audio" && state.audioUrl));

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">HeyGen Video</h1>
          <QuotaDisplay quota={quota} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Avatar Selection */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            1. Select Avatar
          </h2>
          <AvatarSelector
            avatars={displayAvatars}
            groups={groups}
            selectedAvatar={state.selectedAvatar}
            selectedGroupId={state.selectedGroupId}
            onAvatarSelect={handleAvatarSelect}
            onGroupSelect={handleGroupSelect}
            isLoading={isLoadingAvatars || groupsLoading}
            error={avatarsError}
          />
        </section>

        {/* Voice Selection (only for text input) */}
        {state.inputType === "text" && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              2. Select Voice
            </h2>
            <VoiceSelector
              voices={voices}
              selectedVoice={state.selectedVoice}
              onVoiceSelect={handleVoiceSelect}
              isLoading={voicesLoading}
              error={voicesError}
            />
          </section>
        )}

        {/* Input Type Toggle */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {state.inputType === "text" ? "3" : "2"}. Input Type
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleInputTypeChange("text")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                state.inputType === "text"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Text to Speech
            </button>
            <button
              onClick={() => handleInputTypeChange("audio")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                state.inputType === "audio"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Upload Audio
            </button>
          </div>
        </section>

        {/* Text Input or Audio Upload */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {state.inputType === "text" ? "4" : "3"}. {state.inputType === "text" ? "Enter Text" : "Upload Audio"}
          </h2>
          {state.inputType === "text" ? (
            <TextInput
              value={state.inputText}
              onChange={handleTextChange}
              maxLength={5000}
            />
          ) : (
            <AudioUpload
              audioUrl={state.audioUrl}
              fileName={state.audioFileName}
              onUpload={handleAudioUpload}
              onRemove={handleAudioRemove}
              isUploading={isUploading}
            />
          )}
        </section>

        {/* Video Settings */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {state.inputType === "text" ? "5" : "4"}. Video Settings
          </h2>
          <VideoSettings
            aspectRatio={state.aspectRatio}
            avatarStyle={state.avatarStyle}
            background={state.background}
            testMode={state.testMode}
            onAspectRatioChange={(ratio) => dispatch(videoActions.setAspectRatio(ratio))}
            onAvatarStyleChange={(style) => dispatch(videoActions.setAvatarStyle(style))}
            onBackgroundChange={(bg) => dispatch(videoActions.setBackground(bg))}
            onTestModeChange={(enabled) => dispatch(videoActions.setTestMode(enabled))}
          />
        </section>

        {/* Video Preview */}
        {(state.currentVideoId || state.videoUrl) && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Video Result
            </h2>
            <VideoPreview
              status={state.videoStatus}
              videoUrl={state.videoUrl}
              thumbnailUrl={state.thumbnailUrl}
              error={state.generationError}
            />
          </section>
        )}

        {/* Error Display */}
        {(avatarsError || voicesError || generateError || state.generationError) && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              {avatarsError || voicesError || generateError || state.generationError}
            </p>
          </div>
        )}
      </div>

      {/* Fixed Generate Button */}
      <GenerateButton
        onClick={handleGenerate}
        disabled={!canGenerate}
        isLoading={isGenerating || state.isGenerating}
        isTelegram={isTelegram}
      />
    </main>
  );
}
