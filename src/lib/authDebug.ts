/**
 * Auth Debug Utils
 * Các hàm helper để debug và fix authentication issues
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

/**
 * Clear tất cả auth data và storage
 * Dùng khi gặp lỗi 400 hoặc session corrupt
 */
export async function clearAuthStorage() {
  try {
    console.log("🧹 Clearing auth storage...");

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(
      (key) => key.includes("supabase") || key.includes("auth"),
    );

    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
      console.log("✅ Cleared auth keys:", authKeys);
    }

    console.log("✅ Auth storage cleared successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error clearing auth storage:", error);
    return false;
  }
}

/**
 * Log tất cả storage keys (để debug)
 */
export async function logStorageKeys() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log("📦 All storage keys:", keys);

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`  - ${key}:`, value?.substring(0, 50) + "...");
    }
  } catch (error) {
    console.error("❌ Error logging storage:", error);
  }
}

/**
 * Check Supabase connection
 */
export async function checkSupabaseConnection() {
  try {
    console.log("🔍 Checking Supabase connection...");

    const { data, error } = await supabase
      .from("products")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
      return false;
    }

    console.log("✅ Supabase connected successfully!");
    return true;
  } catch (error) {
    console.error("❌ Network error:", error);
    return false;
  }
}

/**
 * Get current auth state (để debug)
 */
export async function getAuthState() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.log("⚠️ Auth state error:", error.message);
      return null;
    }

    if (session) {
      console.log("✅ Session active:", {
        user: session.user.email,
        expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
      });
    } else {
      console.log("ℹ️ No active session");
    }

    return session;
  } catch (error) {
    console.error("❌ Error getting auth state:", error);
    return null;
  }
}

/**
 * Complete auth reset - dùng khi mọi cách khác fail
 */
export async function resetAuth() {
  console.log("🔄 Performing complete auth reset...");

  await clearAuthStorage();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("✅ Auth reset complete! Please restart the app.");
}
