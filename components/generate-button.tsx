"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { showMainButton, hideMainButton, setMainButtonLoading, getTelegramWebApp } from "@/lib/telegram/telegram-webapp";

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  isTelegram: boolean;
}

export function GenerateButton({
  onClick,
  disabled,
  isLoading,
  isTelegram,
}: GenerateButtonProps) {
  // Use Telegram Main Button when in Telegram WebApp
  useEffect(() => {
    if (!isTelegram) return;

    const webApp = getTelegramWebApp();
    if (!webApp) return;

    // Always show the button, but disable it when needed
    showMainButton("Save Settings", onClick);
    setMainButtonLoading(isLoading);

    if (disabled || isLoading) {
      webApp.MainButton.disable();
    } else {
      webApp.MainButton.enable();
    }

    return () => {
      hideMainButton();
    };
  }, [isTelegram, disabled, isLoading, onClick]);

  // Show web button only when not in Telegram
  if (isTelegram) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t safe-area-bottom">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "w-full py-4 px-6 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2",
          disabled || isLoading
            ? "bg-secondary text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
        )}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Save Settings</span>
          </>
        )}
      </button>
    </div>
  );
}

