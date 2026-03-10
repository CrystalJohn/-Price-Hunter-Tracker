import { supabase } from "./supabase";

export async function addFavorite(userId: string, productId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, product_id: productId })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function removeFavorite(userId: string, productId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .delete()
    .match({ user_id: userId, product_id: productId })
    .select();
  if (error) throw error;
  return data;
}

export async function removeFavorites(userId: string, productIds: string[]) {
  if (productIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .in("product_id", productIds)
    .select();
    
  if (error) throw error;
  return data;
}
