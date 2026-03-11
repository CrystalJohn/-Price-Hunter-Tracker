import { supabase } from "./supabase";
// Removed expo-file-system import (not used after switching to fetch/blob upload)
import type { UserProfile } from "../types/domain";

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No profile found
    console.error("Error fetching profile:", error);
    throw error;
  }

  return data;
}

export async function uploadAvatar(
  userId: string,
  imageUri: string,
): Promise<string> {
  try {
    // 1. Fetch image as Blob (works in Expo/React Native) and upload
    const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${userId}-${Date.now()}.${ext}`;
    const filePath = `avatars/${fileName}`;

    const response = await fetch(imageUri);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.status}`);
    const blob = await response.blob();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, blob as any, {
        contentType: `image/${ext}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 3. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 4. Update profile table
    const { error: updateError } = await supabase.from("profiles").upsert({
      id: userId,
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    });

    if (updateError) throw updateError;

    return publicUrl;
  } catch (err) {
    console.error("Error uploading avatar:", err);
    throw err;
  }
}
