"use client";

import { useState, useEffect, useCallback } from "react";
import { getTelegramWebApp } from "@/lib/telegram/telegram-webapp";
import type { TelegramUser, AuthResponse } from "@/lib/types/telegram";

interface AuthState {
  isLoading: boolean;
  isAuthorized: boolean;
  user: TelegramUser | null;
  error: string | null;
  isTelegram: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthorized: false,
    user: null,
    error: null,
    isTelegram: false,
  });

  const verifyAuth = useCallback(async () => {
    const webApp = getTelegramWebApp();

    // Not in Telegram - deny access in production
    if (!webApp) {
      // Check if we're in development mode (via environment variable)
      // In production, this will be false, so access will be denied
      const allowDevAccess = 
        typeof window !== "undefined" && 
        window.location.hostname === "localhost";
      
      setState({
        isLoading: false,
        isAuthorized: allowDevAccess, // Only allow on localhost
        user: null,
        error: allowDevAccess 
          ? null 
          : "Это приложение доступно только через Telegram Mini App. Откройте его через бота в Telegram.",
        isTelegram: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, isTelegram: true }));

    const initData = webApp.initData;

    if (!initData) {
      setState({
        isLoading: false,
        isAuthorized: false,
        user: null,
        error: "No Telegram init data available",
        isTelegram: true,
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      const data: AuthResponse = await response.json();

      setState({
        isLoading: false,
        isAuthorized: data.authorized,
        user: data.user || null,
        error: data.error || null,
        isTelegram: true,
      });

      // Show error in Telegram popup if not authorized
      if (!data.authorized && data.error) {
        webApp.showAlert(data.error);
      }
    } catch (error) {
      setState({
        isLoading: false,
        isAuthorized: false,
        user: null,
        error: "Failed to verify authorization",
        isTelegram: true,
      });
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  return {
    ...state,
    retry: verifyAuth,
  };
}

