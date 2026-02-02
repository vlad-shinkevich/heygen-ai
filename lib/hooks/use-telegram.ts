"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTelegramWebApp,
  isTelegramWebApp,
  initTelegramWebApp,
  getTelegramUser,
  getColorScheme,
  applyTelegramTheme,
  hapticImpact,
  hapticNotification,
  hapticSelection,
  showMainButton,
  hideMainButton,
  setMainButtonLoading,
  showBackButton,
  hideBackButton,
  showAlert,
  showConfirm,
} from "@/lib/telegram/telegram-webapp";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Initialize Telegram WebApp
    const webApp = initTelegramWebApp();
    
    if (webApp) {
      setIsTelegram(true);
      setUser(getTelegramUser());
      setColorScheme(getColorScheme());
      applyTelegramTheme();

      // Listen for theme changes
      const handleThemeChange = () => {
        setColorScheme(getColorScheme());
        applyTelegramTheme();
      };

      webApp.onEvent("themeChanged", handleThemeChange);
      
      setIsReady(true);

      return () => {
        webApp.offEvent("themeChanged", handleThemeChange);
      };
    } else {
      // Not in Telegram - still mark as ready for web usage
      setIsReady(true);
    }
  }, []);

  return {
    isReady,
    isTelegram,
    user,
    colorScheme,
    webApp: getTelegramWebApp(),
  };
}

export function useTelegramMainButton() {
  const show = useCallback(
    (text: string, onClick: () => void, options?: { color?: string; textColor?: string }) => {
      showMainButton(text, onClick, options);
    },
    []
  );

  const hide = useCallback(() => {
    hideMainButton();
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setMainButtonLoading(loading);
  }, []);

  return { show, hide, setLoading };
}

export function useTelegramBackButton() {
  const show = useCallback((onClick: () => void) => {
    showBackButton(onClick);
  }, []);

  const hide = useCallback(() => {
    hideBackButton();
  }, []);

  return { show, hide };
}

export function useTelegramHaptic() {
  const impact = useCallback(
    (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium") => {
      hapticImpact(style);
    },
    []
  );

  const notification = useCallback((type: "error" | "success" | "warning") => {
    hapticNotification(type);
  }, []);

  const selection = useCallback(() => {
    hapticSelection();
  }, []);

  return { impact, notification, selection };
}

export function useTelegramPopup() {
  const alert = useCallback(async (message: string) => {
    await showAlert(message);
  }, []);

  const confirm = useCallback(async (message: string) => {
    return await showConfirm(message);
  }, []);

  return { alert, confirm };
}

