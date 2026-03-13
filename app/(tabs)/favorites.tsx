import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../src/lib/supabase";
import { ProductCard } from "../../src/components/product/ProductCard";
import { removeFavorites } from "../../src/lib/favorites";
import type { Product, ProductPrice } from "../../src/types/domain";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export default function FavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Query favorites/products/prices — call hooks unconditionally but disable when unauthenticated
  const { data, isLoading } = useQuery<
    { products: Product[]; prices: ProductPrice[] },
    Error,
    { products: Product[]; prices: ProductPrice[] }
  >({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data: favs, error: fErr } = await supabase
        .from("favorites")
        .select("product_id")
        .order("created_at", { ascending: false });
      if (fErr) {
        console.error("Supabase(favorites) error:", fErr);
        throw new Error(fErr.message ?? JSON.stringify(fErr));
      }
      const ids = (favs ?? []).map((f: any) => f.product_id) as string[];
      if (ids.length === 0) return { products: [], prices: [] };
      const res: any = await supabase
        .from("products")
        .select("*")
        .in("id", ids);
      if (res.error) {
        console.error("Supabase(products by ids) error:", res.error);
        throw new Error(res.error.message ?? JSON.stringify(res.error));
      }

      const prRes: any = await supabase
        .from("product_prices")
        .select("*")
        .in("product_id", ids);
      if (prRes.error) {
        console.error("Supabase(product_prices) error:", prRes.error);
        throw new Error(prRes.error.message ?? JSON.stringify(prRes.error));
      }

      const mappedPrices = (prRes.data ?? []).map((r: any) => ({
        id: r.id,
        productId: r.product_id ?? r.productId,
        storeId: r.store_id ?? r.storeId,
        price: Number(r.price),
        updatedAt: r.updated_at ?? r.updatedAt,
      }));

      const mappedProducts = (res.data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        imageUrl: p.image_url ?? p.imageUrl,
        createdAt: p.created_at ?? p.createdAt,
      }));

      return { products: mappedProducts as Product[], prices: mappedPrices };
    },
    enabled: !!isAuthenticated,
  });

  // Derived values (hooks must run before any early returns)
  const filteredFavorites = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const products = data?.products ?? [];
    if (!normalizedQuery) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(normalizedQuery),
    );
  }, [data, searchQuery]);

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.notAuthContainer}>
          <View style={styles.notAuthIconContainer}>
            <Ionicons name="heart-dislike-outline" size={120} color="#D1D5DB" />
          </View>
          <Text style={styles.notAuthTitle}>Sign In Required</Text>
          <Text style={styles.notAuthSubtitle}>
            Please sign in to view and manage your favorite products
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signUpTextButton}
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <Text style={styles.signUpText}>
              Don't have an account?{" "}
              <Text style={styles.signUpTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getLowestPrice = (productId: string) => {
    if (!data?.prices) return null;
    const itemPrices = data.prices.filter((p) => p.productId === productId);
    if (itemPrices.length === 0) return null;
    return Math.min(...itemPrices.map((p) => p.price));
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredFavorites.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFavorites.map((p) => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await removeFavorites(user.id, Array.from(selectedIds));
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
      setSelectedIds(new Set());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to delete favorites", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data || data.products.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="heart-dislike-outline" size={64} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start adding products to your favorites to see them here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (filteredFavorites.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <TextInput
              placeholder="Search items"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity style={styles.searchButton} activeOpacity={0.85}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header Actions */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setIsEditing(!isEditing);
            setSelectedIds(new Set());
          }}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? "Cancel" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <TextInput
            placeholder="Search items"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.85}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <FlatList<Product>
        data={filteredFavorites}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <View style={styles.itemContainer}>
              {isEditing && (
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => toggleSelection(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? "#EF4444" : "#D1D5DB"}
                  />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }}>
                <ProductCard
                  product={item}
                  lowestPrice={getLowestPrice(item.id)}
                  onPress={() => {
                    if (isEditing) {
                      toggleSelection(item.id);
                    } else {
                      router.push(`/product/${item.id}`);
                    }
                  }}
                />
              </View>
            </View>
          );
        }}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {isEditing && (
        <View style={styles.bottomActionBar}>
          {filteredFavorites.length >= 2 && (
            <TouchableOpacity style={styles.actionBtn} onPress={selectAll}>
              <Ionicons
                name={
                  selectedIds.size === filteredFavorites.length
                    ? "ellipse-outline"
                    : "checkmark-circle-outline"
                }
                size={22}
                color="#4B5563"
              />
              <Text style={styles.actionBtnText}>
                {selectedIds.size === filteredFavorites.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[
              styles.deleteBtn,
              selectedIds.size === 0 && styles.deleteBtnDisabled,
            ]}
            onPress={handleBulkDelete}
            disabled={selectedIds.size === 0 || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#FFF" />
                <Text style={styles.deleteBtnText}>
                  Delete ({selectedIds.size})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  editButtonText: {
    color: "#3B82F6",
    fontWeight: "700",
    fontSize: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 12,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
    color: "#0F172A",
    paddingVertical: 4,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 300,
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  notAuthIconContainer: {
    marginBottom: 24,
  },
  notAuthTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  notAuthSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  signInButton: {
    flexDirection: "row",
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  signUpTextButton: {
    padding: 8,
  },
  signUpText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signUpTextBold: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    padding: 10,
    marginRight: 4,
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  deleteBtnDisabled: {
    backgroundColor: "#FCA5A5",
  },
  deleteBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
