/**
 * Telegram Bot API service for sending videos to users
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = "https://api.telegram.org/bot";

/**
 * Send video to user via Telegram Bot API
 */
export async function sendVideoToUser(
  chatId: number,
  videoUrl: string,
  caption?: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return false;
  }

  try {
    const url = `${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendVideo`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        video: videoUrl,
        caption: caption || "Ваше видео готово! 🎬",
        supports_streaming: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending video to Telegram:", error);
    return false;
  }
}

/**
 * Send message to user via Telegram Bot API
 */
export async function sendMessageToUser(
  chatId: number,
  text: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return false;
  }

  try {
    const url = `${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
    return false;
  }
}

/**
 * Send error message to user (text only, no video)
 */
export async function sendErrorMessage(
  chatId: number,
  errorText: string
): Promise<boolean> {
  return sendMessageToUser(chatId, errorText);
}

/**
 * Send video with custom keyboard
 */
export async function sendVideoWithKeyboard(
  chatId: number,
  videoUrl: string,
  caption?: string,
  keyboard?: Array<Array<{ text: string; url?: string; callback_data?: string }>>
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return false;
  }

  try {
    const url = `${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendVideo`;

    const replyMarkup = keyboard
      ? {
          inline_keyboard: keyboard,
        }
      : undefined;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        video: videoUrl,
        caption: caption || "Ваше видео готово! 🎬",
        supports_streaming: true,
        reply_markup: replyMarkup,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending video with keyboard:", error);
    return false;
  }
}
