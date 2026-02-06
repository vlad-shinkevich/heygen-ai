"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useTelegram, useTelegramHaptic } from "@/lib/hooks/use-telegram";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useAvatars,
  useAvatarGroups,
  useUserAvatarGroups,
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
  const { groups: userGroups, isLoading: userGroupsLoading } = useUserAvatarGroups();
  const { avatars: groupAvatars, isLoading: groupAvatarsLoading } = useAvatarsInGroup(
    state.selectedGroupId
  );
  const { voices, isLoading: voicesLoading, error: voicesError } = useVoices();
  const { quota, refetch: refetchQuota } = useQuota();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"regular" | "user">("regular");
  const settingsLoadedRef = useRef(false);

  // Get user group avatars if user tab is selected
  const { avatars: userGroupAvatars, isLoading: userGroupAvatarsLoading } = useAvatarsInGroup(
    selectedTab === "user" && state.selectedGroupId ? state.selectedGroupId : null
  );

  // Combine all avatars (either from selected group or all avatars)
  const displayAvatars = state.selectedGroupId ? groupAvatars : avatars;
  const isLoadingAvatars = state.selectedGroupId ? groupAvatarsLoading : avatarsLoading;
  
  // User avatars display - if no group selected, show empty (will be populated by fetching all groups)
  // For now, we only show avatars when a specific group is selected
  const displayUserAvatars = state.selectedGroupId && selectedTab === "user" ? userGroupAvatars : [];
  const isLoadingUserAvatars = state.selectedGroupId && selectedTab === "user" ? userGroupAvatarsLoading : false;

  // Load saved settings on mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      // Only load once
      if (settingsLoadedRef.current) return;
      
      // Wait for user, avatars, and voices to be loaded
      if (!user?.id || avatarsLoading || voicesLoading || avatars.length === 0 || voices.length === 0) {
        return;
      }

      // Mark as loading to prevent duplicate loads
      settingsLoadedRef.current = true;

      try {
        const response = await fetch(`/api/video/get-settings?telegramId=${user.id}`);
        const result = await response.json();

        if (result.success && result.data) {
          const settings = result.data;

          // Find and set avatar
          if (settings.avatarId) {
            // Search in all avatars first
            let foundAvatar = avatars.find((a) => a.avatar_id === settings.avatarId);
            
            // If found in all avatars, ensure group is reset to null (show all)
            if (foundAvatar) {
              if (state.selectedGroupId !== null) {
                dispatch(videoActions.setGroup(null));
              }
              dispatch(videoActions.setAvatar(foundAvatar));
            } else {
              // If not found in all avatars, search in group avatars
              // This means avatar is in a group, so group should already be selected
              if (groupAvatars.length > 0) {
                foundAvatar = groupAvatars.find((a) => a.avatar_id === settings.avatarId);
                if (foundAvatar) {
                  dispatch(videoActions.setAvatar(foundAvatar));
                }
              } else {
                // Avatar not found in current group, try to find which group it belongs to
                // For now, just search in all avatars again (maybe it was added to all list)
                foundAvatar = avatars.find((a) => a.avatar_id === settings.avatarId);
                if (foundAvatar) {
                  if (state.selectedGroupId !== null) {
                    dispatch(videoActions.setGroup(null));
                  }
                  dispatch(videoActions.setAvatar(foundAvatar));
                }
              }
            }
          }

          // Find and set voice
          if (settings.voiceId) {
            const foundVoice = voices.find((v) => v.voice_id === settings.voiceId);
            if (foundVoice) {
              dispatch(videoActions.setVoice(foundVoice));
            }
          }

          // Restore other settings
          if (settings.aspectRatio) {
            dispatch(videoActions.setAspectRatio(settings.aspectRatio));
          }

          if (settings.avatarStyle) {
            dispatch(videoActions.setAvatarStyle(settings.avatarStyle));
          }

          if (settings.background) {
            dispatch(videoActions.setBackground(settings.background));
          }
        }
      } catch (error) {
        console.error("Error loading saved settings:", error);
        // Don't mark as loaded on error, so we can retry
        settingsLoadedRef.current = false;
      }
    };

    loadSavedSettings();
  }, [user?.id, avatars, voices, avatarsLoading, voicesLoading, groupAvatars, dispatch]);

  // Handle avatar selection
  const handleAvatarSelect = (avatar: Avatar) => {
    haptic.selection();
    dispatch(videoActions.setAvatar(avatar));
  };

  // Handle voice selection (can be null for default voice)
  const handleVoiceSelect = (voice: Voice | null) => {
    haptic.selection();
    dispatch(videoActions.setVoice(voice));
  };

  // Handle group selection
  const handleGroupSelect = (groupId: string | null) => {
    haptic.selection();
    dispatch(videoActions.setGroup(groupId));
    dispatch(videoActions.setAvatar(null)); // Reset avatar when changing group
  };

  // Handle tab change
  const handleTabChange = (tab: "regular" | "user") => {
    haptic.selection();
    setSelectedTab(tab);
    dispatch(videoActions.setGroup(null)); // Reset group when switching tabs
    dispatch(videoActions.setAvatar(null)); // Reset avatar when switching tabs
  };


  // Handle generate (save settings)
  const handleGenerate = useCallback(async () => {
    // Prevent double calls
    if (isGenerating) {
      return;
    }

    if (!state.selectedAvatar) {
      haptic.notification("error");
      return;
    }

    if (!user?.id) {
      haptic.notification("error");
      return;
    }

    // Voice is required unless avatar has default voice
    if (!state.selectedVoice && !state.selectedAvatar.default_voice_id) {
      haptic.notification("error");
      return;
    }

    try {
      setIsGenerating(true);
      haptic.impact("medium");

      // Prepare settings data
      const settingsData = {
        telegramId: user.id,
        avatarId: state.selectedAvatar.avatar_id,
        avatarName: state.selectedAvatar.avatar_name,
        avatarImageUrl: state.selectedAvatar.preview_image_url,
        voiceId: state.selectedVoice?.voice_id || state.selectedAvatar.default_voice_id || null,
        aspectRatio: state.aspectRatio,
        avatarStyle: state.avatarStyle,
        background: state.background,
      };

      console.log("Sending settings to API:", settingsData);

      // Save settings to Supabase database
      const response = await fetch("/api/video/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      const result = await response.json();

      if (result.success) {
        await showAlert("Settings saved");
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
  }, [isGenerating, state.selectedAvatar, state.selectedVoice, state.aspectRatio, state.avatarStyle, state.background, user?.id, haptic, dispatch]);

  // Check if settings can be saved (voice can be null if using default)
  const canGenerate = state.selectedAvatar && (state.selectedVoice !== null || state.selectedAvatar.default_voice_id);

  // Show loading until everything is ready and loaded
  const isEverythingLoaded = isReady && 
    !avatarsLoading && 
    !voicesLoading && 
    !groupsLoading && 
    !userGroupsLoading &&
    avatars.length > 0 && 
    voices.length > 0;

  if (!isReady || !isEverythingLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Loading...</p>
            {!isReady && <p className="text-xs text-muted-foreground">Initializing...</p>}
            {avatarsLoading && <p className="text-xs text-muted-foreground">Loading avatars...</p>}
            {voicesLoading && <p className="text-xs text-muted-foreground">Loading voices...</p>}
            {groupsLoading && <p className="text-xs text-muted-foreground">Loading groups...</p>}
            {userGroupsLoading && <p className="text-xs text-muted-foreground">Loading user avatars...</p>}
          </div>
        </div>
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
            userGroups={userGroups}
            userGroupAvatars={displayUserAvatars}
            selectedAvatar={state.selectedAvatar}
            selectedGroupId={state.selectedGroupId}
            selectedTab={selectedTab}
            onAvatarSelect={handleAvatarSelect}
            onGroupSelect={handleGroupSelect}
            onTabChange={handleTabChange}
            isLoading={isLoadingAvatars || groupsLoading}
            isLoadingUserGroups={userGroupsLoading || isLoadingUserAvatars}
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
            defaultVoiceId={state.selectedAvatar?.default_voice_id}
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
            onAspectRatioChange={(ratio) => dispatch(videoActions.setAspectRatio(ratio))}
            onAvatarStyleChange={(style) => dispatch(videoActions.setAvatarStyle(style))}
            onBackgroundChange={(bg) => dispatch(videoActions.setBackground(bg))}
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
