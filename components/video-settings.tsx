"use client";

import { cn } from "@/lib/utils";
import type { VideoBackground } from "@/lib/types/heygen";

interface VideoSettingsProps {
  aspectRatio: "16:9" | "9:16" | "1:1";
  avatarStyle: "normal" | "circle" | "closeUp";
  background: VideoBackground;
  testMode: boolean;
  onAspectRatioChange: (ratio: "16:9" | "9:16" | "1:1") => void;
  onAvatarStyleChange: (style: "normal" | "circle" | "closeUp") => void;
  onBackgroundChange: (background: VideoBackground) => void;
  onTestModeChange: (enabled: boolean) => void;
}

const aspectRatios = [
  { value: "16:9" as const, label: "16:9", icon: "📺" },
  { value: "9:16" as const, label: "9:16", icon: "📱" },
  { value: "1:1" as const, label: "1:1", icon: "🟦" },
];

const avatarStyles = [
  { value: "normal" as const, label: "Normal" },
  { value: "circle" as const, label: "Circle" },
  { value: "closeUp" as const, label: "Close Up" },
];

const presetColors = [
  "#ffffff",
  "#000000",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#e94560",
  "#533483",
  "#00b894",
  "#fdcb6e",
  "#6c5ce7",
];

export function VideoSettings({
  aspectRatio,
  avatarStyle,
  background,
  testMode,
  onAspectRatioChange,
  onAvatarStyleChange,
  onBackgroundChange,
  onTestModeChange,
}: VideoSettingsProps) {
  return (
    <div className="space-y-5">
      {/* Aspect Ratio */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Aspect Ratio
        </label>
        <div className="flex gap-2">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => onAspectRatioChange(ratio.value)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                aspectRatio === ratio.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <span>{ratio.icon}</span>
              <span>{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Avatar Style */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Avatar Style
        </label>
        <div className="flex gap-2">
          {avatarStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => onAvatarStyleChange(style.value)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                avatarStyle === style.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Background Color
        </label>
        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onBackgroundChange({ type: "color", value: color })}
              className={cn(
                "w-8 h-8 rounded-lg border-2 transition-all",
                background.type === "color" && background.value === color
                  ? "border-primary ring-2 ring-primary/30 scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          {/* Custom Color Picker */}
          <div className="relative">
            <input
              type="color"
              value={background.type === "color" ? background.value : "#ffffff"}
              onChange={(e) =>
                onBackgroundChange({ type: "color", value: e.target.value })
              }
              className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
            />
            <div
              className={cn(
                "w-8 h-8 rounded-lg border-2 flex items-center justify-center",
                "bg-gradient-to-br from-red-500 via-green-500 to-blue-500",
                background.type === "color" &&
                  !presetColors.includes(background.value)
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent"
              )}
            >
              <span className="text-xs">🎨</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Mode Toggle */}
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div>
          <p className="text-sm font-medium">Test Mode</p>
          <p className="text-xs text-muted-foreground">
            Generate watermarked preview (free)
          </p>
        </div>
        <button
          onClick={() => onTestModeChange(!testMode)}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors",
            testMode ? "bg-primary" : "bg-secondary"
          )}
        >
          <span
            className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
              testMode ? "translate-x-7" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}

