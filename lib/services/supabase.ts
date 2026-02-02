import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { AllowedUser } from "@/lib/types/telegram";

// Supabase client singleton
let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      throw new Error("Missing Supabase environment variables");
    }

    console.log("Initializing Supabase client with URL:", supabaseUrl);
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  return supabase;
}

// ============ User Access Functions ============

/**
 * Check if a Telegram user is in the allowed users list
 */
export async function isUserAllowed(telegramId: number): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    console.log("Checking access for telegram_id:", telegramId);

    const { data, error } = await client
      .from("allowed_users")
      .select("id, is_active")
      .eq("telegram_id", telegramId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Supabase query error:", error);
      // If error is "PGRST116" (no rows returned), user is not in list
      if (error.code === "PGRST116") {
        console.log("User not found in allowed_users table");
        return false;
      }
      // Other errors might be connection issues
      console.error("Unexpected error:", error);
      return false;
    }

    if (!data) {
      console.log("No data returned from query");
      return false;
    }

    console.log("User found and is active:", data);
    return true;
  } catch (err) {
    console.error("Error checking user access:", err);
    return false;
  }
}

/**
 * Get allowed user by Telegram ID
 */
export async function getAllowedUser(
  telegramId: number
): Promise<AllowedUser | null> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("allowed_users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AllowedUser;
  } catch {
    console.error("Error getting user");
    return null;
  }
}

/**
 * Add a new allowed user (for admin purposes)
 */
export async function addAllowedUser(params: {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  notes?: string;
}): Promise<AllowedUser | null> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("allowed_users")
      .insert({
        telegram_id: params.telegramId,
        username: params.username,
        first_name: params.firstName,
        last_name: params.lastName,
        notes: params.notes,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding user:", error);
      return null;
    }

    return data as AllowedUser;
  } catch {
    console.error("Error adding user");
    return null;
  }
}

/**
 * Update user's last activity (optional tracking)
 */
export async function updateUserActivity(telegramId: number): Promise<void> {
  try {
    const client = getSupabaseClient();

    await client
      .from("allowed_users")
      .update({ updated_at: new Date().toISOString() })
      .eq("telegram_id", telegramId);
  } catch {
    // Silent fail for activity tracking
  }
}

/**
 * Deactivate a user
 */
export async function deactivateUser(telegramId: number): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from("allowed_users")
      .update({ is_active: false })
      .eq("telegram_id", telegramId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Get all allowed users (for admin purposes)
 */
export async function getAllAllowedUsers(): Promise<AllowedUser[]> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("allowed_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as AllowedUser[];
  } catch {
    return [];
  }
}

