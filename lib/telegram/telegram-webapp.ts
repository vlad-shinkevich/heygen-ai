"use client";

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: ThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: BackButton;
  MainButton: MainButton;
  HapticFeedback: HapticFeedback;
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  showPopup: (params: PopupParams, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  sendData: (data: string) => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
}

interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface BackButton {
  isVisible: boolean;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
}

interface MainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }) => void;
}

interface HapticFeedback {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notificationOccurred: (type: "error" | "success" | "warning") => void;
  selectionChanged: () => void;
}

interface PopupParams {
  title?: string;
  message: string;
  buttons?: Array<{
    id?: string;
    type?: "default" | "ok" | "close" | "cancel" | "destructive";
    text?: string;
  }>;
}

// ============ Utility Functions ============

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function isTelegramWebApp(): boolean {
  return getTelegramWebApp() !== null;
}

export function initTelegramWebApp(): TelegramWebApp | null {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
    return webApp;
  }
  return null;
}

export function getTelegramUser(): TelegramUser | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}

export function getColorScheme(): "light" | "dark" {
  const webApp = getTelegramWebApp();
  return webApp?.colorScheme || "light";
}

export function getThemeParams(): ThemeParams {
  const webApp = getTelegramWebApp();
  return webApp?.themeParams || {};
}

// ============ Haptic Feedback ============

export function hapticImpact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium") {
  const webApp = getTelegramWebApp();
  webApp?.HapticFeedback?.impactOccurred(style);
}

export function hapticNotification(type: "error" | "success" | "warning") {
  const webApp = getTelegramWebApp();
  webApp?.HapticFeedback?.notificationOccurred(type);
}

export function hapticSelection() {
  const webApp = getTelegramWebApp();
  webApp?.HapticFeedback?.selectionChanged();
}

// ============ Main Button ============

export function showMainButton(
  text: string,
  onClick: () => void,
  options?: { color?: string; textColor?: string }
) {
  const webApp = getTelegramWebApp();
  if (webApp?.MainButton) {
    webApp.MainButton.setText(text);
    if (options?.color) {
      webApp.MainButton.setParams({ color: options.color });
    }
    if (options?.textColor) {
      webApp.MainButton.setParams({ text_color: options.textColor });
    }
    webApp.MainButton.onClick(onClick);
    webApp.MainButton.show();
  }
}

export function hideMainButton() {
  const webApp = getTelegramWebApp();
  webApp?.MainButton?.hide();
}

export function setMainButtonLoading(loading: boolean) {
  const webApp = getTelegramWebApp();
  if (webApp?.MainButton) {
    if (loading) {
      webApp.MainButton.showProgress();
    } else {
      webApp.MainButton.hideProgress();
    }
  }
}

// ============ Back Button ============

export function showBackButton(onClick: () => void) {
  const webApp = getTelegramWebApp();
  if (webApp?.BackButton) {
    webApp.BackButton.onClick(onClick);
    webApp.BackButton.show();
  }
}

export function hideBackButton() {
  const webApp = getTelegramWebApp();
  webApp?.BackButton?.hide();
}

// ============ Popups ============

export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showAlert(message, resolve);
    } else {
      alert(message);
      resolve();
    }
  });
}

export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showConfirm(message, resolve);
    } else {
      resolve(confirm(message));
    }
  });
}

// ============ Theme CSS Variables ============

export function applyTelegramTheme() {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  const theme = webApp.themeParams;
  const root = document.documentElement;

  if (theme.bg_color) {
    root.style.setProperty("--tg-bg-color", theme.bg_color);
  }
  if (theme.text_color) {
    root.style.setProperty("--tg-text-color", theme.text_color);
  }
  if (theme.hint_color) {
    root.style.setProperty("--tg-hint-color", theme.hint_color);
  }
  if (theme.link_color) {
    root.style.setProperty("--tg-link-color", theme.link_color);
  }
  if (theme.button_color) {
    root.style.setProperty("--tg-button-color", theme.button_color);
  }
  if (theme.button_text_color) {
    root.style.setProperty("--tg-button-text-color", theme.button_text_color);
  }
  if (theme.secondary_bg_color) {
    root.style.setProperty("--tg-secondary-bg-color", theme.secondary_bg_color);
  }
}

