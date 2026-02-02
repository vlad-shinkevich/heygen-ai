"use client";

import { useState, useMemo } from "react";
import type { Voice } from "@/lib/types/heygen";
import { cn } from "@/lib/utils";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: Voice | null;
  onVoiceSelect: (voice: Voice) => void;
  isLoading: boolean;
  error: string | null;
}

export function VoiceSelector({
  voices,
  selectedVoice,
  onVoiceSelect,
  isLoading,
  error,
}: VoiceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Get unique languages
  const languages = useMemo(() => {
    const langs = [...new Set(voices.map((v) => v.language))];
    return langs.sort();
  }, [voices]);

  // Filter voices
  const filteredVoices = useMemo(() => {
    return voices.filter((voice) => {
      const matchesSearch = voice.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesLanguage = !selectedLanguage || voice.language === selectedLanguage;
      const matchesGender = !selectedGender || voice.gender === selectedGender;
      return matchesSearch && matchesLanguage && matchesGender;
    });
  }, [voices, searchQuery, selectedLanguage, selectedGender]);

  // Handle voice preview
  const handlePreview = async (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!voice.preview_audio) return;

    if (playingVoiceId === voice.voice_id) {
      // Stop current preview
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voice.voice_id);

    try {
      const audio = new Audio(voice.preview_audio);
      audio.onended = () => setPlayingVoiceId(null);
      audio.onerror = () => setPlayingVoiceId(null);
      await audio.play();
    } catch {
      setPlayingVoiceId(null);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Language Filter */}
        <select
          value={selectedLanguage || ""}
          onChange={(e) => setSelectedLanguage(e.target.value || null)}
          className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        {/* Gender Filter */}
        <select
          value={selectedGender || ""}
          onChange={(e) => setSelectedGender(e.target.value || null)}
          className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search voices..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Voice List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-secondary animate-pulse"
            />
          ))}
        </div>
      ) : filteredVoices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No voices found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredVoices.map((voice) => (
            <button
              key={voice.voice_id}
              onClick={() => onVoiceSelect(voice)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                selectedVoice?.voice_id === voice.voice_id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-secondary/50 hover:border-primary/50 hover:bg-secondary"
              )}
            >
              {/* Voice Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                  voice.gender === "male"
                    ? "bg-blue-500/20 text-blue-500"
                    : voice.gender === "female"
                    ? "bg-pink-500/20 text-pink-500"
                    : "bg-gray-500/20 text-gray-500"
                )}
              >
                {voice.gender === "male" ? "👨" : voice.gender === "female" ? "👩" : "🎤"}
              </div>

              {/* Voice Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{voice.name}</p>
                <p className="text-xs text-muted-foreground">
                  {voice.language} • {voice.gender}
                </p>
              </div>

              {/* Preview Button */}
              {voice.preview_audio && (
                <button
                  onClick={(e) => handlePreview(voice, e)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    playingVoiceId === voice.voice_id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {playingVoiceId === voice.voice_id ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Selection indicator */}
              {selectedVoice?.voice_id === voice.voice_id && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected Voice Preview */}
      {selectedVoice && (
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-lg",
              selectedVoice.gender === "male"
                ? "bg-blue-500/20 text-blue-500"
                : selectedVoice.gender === "female"
                ? "bg-pink-500/20 text-pink-500"
                : "bg-gray-500/20 text-gray-500"
            )}
          >
            {selectedVoice.gender === "male" ? "👨" : selectedVoice.gender === "female" ? "👩" : "🎤"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{selectedVoice.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedVoice.language} • {selectedVoice.gender}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

