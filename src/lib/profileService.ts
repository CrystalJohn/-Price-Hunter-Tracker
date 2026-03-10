import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
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

export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  try {
    // 1. Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${ext}`;
    const filePath = `avatars/${fileName}`;

    // 2. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, decode(base64), {
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
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({ 
        id: userId, 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      });

    if (updateError) throw updateError;

    return publicUrl;
  } catch (err) {
    console.error("Error uploading avatar:", err);
    throw err;
  }
}
