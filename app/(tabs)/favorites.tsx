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
import type { Product } from "../../src/types/domain";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

export default function FavoritesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
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

  const { data, isLoading } = useQuery<Product[], Error, Product[]>({
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
      if (ids.length === 0) return [] as Product[];
      // avoid complex generic instantiation from Supabase types, cast to any and shape result
      const res: any = await supabase
        .from("products")
        .select("*")
        .in("id", ids);
      if (res.error) {
        console.error("Supabase(products by ids) error:", res.error);
        throw new Error(res.error.message ?? JSON.stringify(res.error));
      }
      return (res.data ?? []) as Product[];
    },
  });

  const filteredFavorites = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!data || !normalizedQuery) return data ?? [];
    return data.filter((p) => p.name.toLowerCase().includes(normalizedQuery));
  }, [data, searchQuery]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
      <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.emptySubtitle}>
            Try a different search term
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/product/${item.id}`)}
          />
        )}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
});