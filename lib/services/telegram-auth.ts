import crypto from "crypto";
import type { TelegramUser, TelegramInitData } from "@/lib/types/telegram";

/**
 * Verify Telegram WebApp initData signature
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramWebAppData(initData: string): {
  valid: boolean;
  data: TelegramInitData | null;
} {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return { valid: false, data: null };
  }

  try {
    // Parse initData as URL params
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      return { valid: false, data: null };
    }

    // Remove hash from params for verification
    params.delete("hash");

    // Create data-check-string (sorted alphabetically)
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Create secret key: HMAC-SHA256(bot_token, "WebAppData")
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(BOT_TOKEN)
      .digest();

    // Calculate hash: HMAC-SHA256(data_check_string, secret_key)
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Compare hashes
    const isValid = calculatedHash === hash;

    if (!isValid) {
      return { valid: false, data: null };
    }

    // Parse the validated data
    const parsedData: TelegramInitData = {
      auth_date: parseInt(params.get("auth_date") || "0"),
      hash: hash,
    };

    // Parse user data if present
    const userStr = params.get("user");
    if (userStr) {
      try {
        parsedData.user = JSON.parse(userStr) as TelegramUser;
      } catch {
        // Invalid user JSON
      }
    }

    // Parse other optional fields
    if (params.get("query_id")) {
      parsedData.query_id = params.get("query_id")!;
    }
    if (params.get("chat_type")) {
      parsedData.chat_type = params.get("chat_type")!;
    }
    if (params.get("chat_instance")) {
      parsedData.chat_instance = params.get("chat_instance")!;
    }
    if (params.get("start_param")) {
      parsedData.start_param = params.get("start_param")!;
    }

    // Check auth_date is not too old (optional: 24 hours)
    const authDate = parsedData.auth_date;
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 hours

    if (now - authDate > maxAge) {
      console.warn("Telegram auth data is too old");
      // You can return false here if you want strict time validation
      // return { valid: false, data: null };
    }

    return { valid: true, data: parsedData };
  } catch (error) {
    console.error("Error verifying Telegram data:", error);
    return { valid: false, data: null };
  }
}

/**
 * Extract user from initData without full verification (for client-side preview)
 * WARNING: Always verify on server before trusting this data!
 */
export function parseInitDataUnsafe(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get("user");

    if (!userStr) {
      return null;
    }

    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}

