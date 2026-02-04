"use client";

import { useEffect, useState } from "react";
import { useTelegram, useTelegramHaptic } from "@/lib/hooks/use-telegram";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useAvatars,
  useAvatarGroups,
  useAvatarsInGroup,
  useVoices,
  useQuota,
} from "@/lib/hooks/use-heygen";
import { useVideoStore, videoActions } from "@/lib/store/video-store";
import { showAlert } from "@/lib/telegram/telegram-webapp";
import type { Avatar, Voice } from "@/lib/types/heygen";

// Components
import { AvatarSelector } from "@/components/avatar-selector";
import { VoiceSelector } from "@/components/voice-selector";
import { VideoSettings } from "@/components/video-settings";
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
  const [isGenerating, setIsGenerating] = useState(false);

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


  // Handle generate (save settings)
  const handleGenerate = async () => {
    if (!state.selectedAvatar) {
      haptic.notification("error");
      return;
    }

    if (!user?.id) {
      haptic.notification("error");
      return;
    }

    if (!state.selectedVoice) {
      haptic.notification("error");
      return;
    }

    try {
      setIsGenerating(true);
      haptic.impact("medium");

      // Save settings to Supabase database
      const response = await fetch("/api/video/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: user.id,
          avatarId: state.selectedAvatar.avatar_id,
          avatarName: state.selectedAvatar.avatar_name,
          voiceId: state.selectedVoice.voice_id,
          aspectRatio: state.aspectRatio,
          avatarStyle: state.avatarStyle,
          background: state.background,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await showAlert("Settings saved ✅");
        haptic.notification("success");
        dispatch(videoActions.resetGeneration());
      } else {
        throw new Error(result.error || "Failed to save settings");
      }
    } catch (error) {
      haptic.notification("error");
      dispatch(videoActions.setError("Failed to save settings"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if settings can be saved
  const canGenerate = state.selectedAvatar && state.selectedVoice;

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
          <h1 className="text-lg font-semibold">Settings</h1>
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

        {/* Voice Selection */}
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

        {/* Video Settings */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            3. Video Settings
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


        {/* Error Display */}
        {(avatarsError || voicesError || state.generationError) && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              {avatarsError || voicesError || state.generationError}
            </p>
          </div>
        )}
      </div>

      {/* Fixed Save Settings Button */}
      <GenerateButton
        onClick={handleGenerate}
        disabled={!canGenerate}
        isLoading={isGenerating || state.isGenerating}
        isTelegram={isTelegram}
      />
    </main>
  );
}
