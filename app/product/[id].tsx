import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../src/lib/supabase";
import type {
  Product,
  ProductPrice,
  PriceHistory,
  DealAnalysis,
} from "../../src/types/domain";
import { PriceTable } from "../../src/components/product/PriceTable";
import { PriceHistoryChart } from "../../src/components/product/PriceHistoryChart";
import { DealAnalysisModal } from "../../src/components/product/DealAnalysisModal";
import { analyzeDealWithAI } from "../../src/lib/geminiService";
import { addFavorite, removeFavorite } from "../../src/lib/favorites";
import { Ionicons } from "@expo/vector-icons";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    })();
  }, []);

  const { data: product } = useQuery<Product | null, Error, Product | null>({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Supabase(products single) error:", error);
        throw new Error(error.message ?? JSON.stringify(error));
      }
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        brand: data.brand,
        imageUrl: data.image_url ?? data.imageUrl,
        createdAt: data.created_at ?? data.createdAt,
      };
    },
    enabled: !!id,
  });

  const { data: prices } = useQuery<ProductPrice[], Error, ProductPrice[]>({
    queryKey: ["product-prices", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_prices")
        .select("*, stores(name)")
        .eq("product_id", id);
      if (error) {
        console.error("Supabase(product_prices) error:", error);
        throw new Error(error.message ?? JSON.stringify(error));
      }
      return (data ?? []).map((r: any) => ({
        id: r.id,
        productId: r.product_id ?? r.productId,
        storeId: r.store_id ?? r.storeId,
        storeName: r.stores?.name ?? r.store_name ?? r.storeName,
        price: Number(r.price),
        updatedAt: r.updated_at ?? r.updatedAt,
      }));
    },
    enabled: !!id,
  });

  const { data: history } = useQuery<PriceHistory[], Error, PriceHistory[]>({
    queryKey: ["price-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .eq("product_id", id)
        .order("recorded_at", { ascending: true })
        .limit(30);
      if (error) {
        console.error("Supabase(price_history) error:", error);
        throw new Error(error.message ?? JSON.stringify(error));
      }
      return (data ?? []).map((h: any) => ({
        id: h.id,
        productId: h.product_id ?? h.productId,
        price: Number(h.price),
        recordedAt: h.recorded_at ?? h.recordedAt,
      }));
    },
    enabled: !!id,
  });

  const lowest = useMemo(
    () =>
      prices && prices.length ? Math.min(...prices.map((p) => p.price)) : null,
    [prices],
  );

  const highest = useMemo(
    () =>
      prices && prices.length ? Math.max(...prices.map((p) => p.price)) : null,
    [prices],
  );

  let discountPercent = 0;
  if (lowest && highest && highest > lowest) {
    discountPercent = Math.round(((highest - lowest) / highest) * 100);
  }

  const categoryInfo = useMemo(() => {
    if (!product) return { label: "Accessories", icon: "pricetag-outline" as const };
    const n = product.name.toLowerCase();
    if (n.includes("bag") || n.includes("backpack") || n.includes("duffel") || n.includes("sack")) {
      return { label: "Bags & Backpacks", icon: "briefcase-outline" as const };
    }
    if (n.includes("bottle") || n.includes("flask") || n.includes("hydration")) {
      return { label: "Hydration", icon: "water-outline" as const };
    }
    if (n.includes("beanie") || n.includes("cap") || n.includes("hat") || n.includes("visor") || n.includes("headband")) {
      return { label: "Headwear", icon: "shirt-outline" as const };
    }
    if (n.includes("kneepad") || n.includes("gaiters") || n.includes("gloves") || n.includes("sweatband")) {
      return { label: "Protective Gear", icon: "shield-checkmark-outline" as const };
    }
    if (n.includes("socks")) {
      return { label: "Footwear Accs", icon: "walk-outline" as const };
    }
    if (n.includes("belt") || n.includes("armband") || n.includes("vest") || n.includes("waistpack")) {
      return { label: "Wearables & Belts", icon: "watch-outline" as const };
    }
    return { label: "Accessories", icon: "pricetag-outline" as const };
  }, [product]);

  // AI Deal Analysis state
  const [aiResult, setAiResult] = useState<DealAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const [isFav, setIsFav] = useState(false);
  useEffect(() => {
    if (!userId || !id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", userId)
          .eq("product_id", id)
          .limit(1)
          .maybeSingle();
        if (error) {
          console.warn("Supabase(favorites) check:", error.message);
          setIsFav(false);
          return;
        }
        setIsFav(data !== null);
      } catch (e) {
        console.error(e);
        setIsFav(false);
      }
    })();
  }, [userId, id]);

  const toggleFollow = useCallback(async () => {
    if (!userId || !id) {
      Alert.alert("Sign in required");
      return;
    }

    try {
      if (isFav) {
        await removeFavorite(userId, id);
        setIsFav(false);
      } else {
        await addFavorite(userId, id);
        setIsFav(true);
      }
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Could not update favorite");
    }
  }, [isFav, userId, id, queryClient]);

  const analyzeDeal = useCallback(async () => {
    if (!prices || prices.length === 0 || !history || !product) {
      Alert.alert("Not enough data to analyze");
      return;
    }

    // Reset previous state and show modal
    setAiResult(null);
    setAiError(null);
    setAiLoading(true);
    setAiModalVisible(true);

    try {
      const avg30 =
        history.reduce((s, h) => s + h.price, 0) / Math.max(1, history.length);
      const discountPercent = lowest ? ((avg30 - lowest) / avg30) * 100 : 0;

      // Determine price trend from history
      let priceTrend: "up" | "down" | "stable" = "stable";
      if (history.length >= 2) {
        const first = history[0].price;
        const last = history[history.length - 1].price;
        const change = ((last - first) / first) * 100;
        if (change > 3) priceTrend = "up";
        else if (change < -3) priceTrend = "down";
      }

      const result = await analyzeDealWithAI({
        productName: product.name,
        avgPrice: avg30,
        priceTrend,
        storeOffers: prices
          ? prices.map((p) => ({
              storeName: p.storeName || "Unknown Store",
              currentPrice: p.price,
              inStock: true,
              trustRating: Math.floor(Math.random() * 3) + 7, // Random 7-9 for demo
            }))
          : [],
      });

      setAiResult(result);
    } catch (err: any) {
      setAiError(err.message ?? "Failed to analyze deal.");
    } finally {
      setAiLoading(false);
    }
  }, [prices, history, lowest, product]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {!product ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading product...</Text>
          </View>
        ) : (
          <>
            {/* Product Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
              {/* Favorite Button Overlay */}
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={toggleFollow}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={28}
                  color={isFav ? "#EF4444" : "#fff"}
                />
              </TouchableOpacity>
            </View>

            {/* Product Info Section */}
            <View style={styles.infoSection}>
              {/* Back to Home */}
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.85}
            >
              <Ionicons name="home-outline" size={18} color="#3B82F6" />
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>

              {/* Tags Row */}
              <View style={styles.tagsRow}>
                {/* Brand Badge */}
                <View style={[styles.pill, styles.brandPill]}>
                  <Ionicons name="business-outline" size={14} color="#3B82F6" />
                  <Text style={styles.brandText}>{product.brand}</Text>
                </View>
                
                {/* Category Badge */}
                <View style={[styles.pill, styles.categoryPill]}>
                  <Ionicons name={categoryInfo.icon} size={14} color="#8B5CF6" />
                  <Text style={styles.categoryText}>{categoryInfo.label}</Text>
                </View>
              </View>

              {/* Product Name */}
              <Text style={styles.productName}>{product.name}</Text>

              {/* Lowest Price Highlight */}
              <View style={styles.priceHighlight}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Best Price</Text>
                  {discountPercent > 0 && (
                    <View style={styles.savingsBadge}>
                      <Ionicons
                        name="trending-down"
                        size={14}
                        color="#EF4444"
                      />
                      <Text style={styles.savingsText}>Save {discountPercent}%</Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceValueRow}>
                  <Text style={styles.priceValue}>
                    {lowest == null ? "—" : `€${lowest.toFixed(2)}`}
                  </Text>
                  {discountPercent > 0 && highest && (
                    <Text style={styles.originalPrice}>
                      €{highest.toFixed(2)}
                    </Text>
                  )}
                </View>
                {prices && prices.length > 1 && (
                  <Text style={styles.priceSubtext}>
                    Compare prices from {prices.length} stores
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={analyzeDeal}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>AI Deal Analysis</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Comparison Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pricetags-outline" size={20} color="#111827" />
                <Text style={styles.sectionTitle}>Store Prices</Text>
              </View>
              <PriceTable prices={prices ?? []} />
            </View>

            {/* Price History Chart Section */}
            {history && history.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="trending-up-outline"
                    size={20}
                    color="#111827"
                  />
                  <Text style={styles.sectionTitle}>Price History</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Track price changes over the last 30 days
                </Text>
                <PriceHistoryChart history={history} />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* AI Deal Analysis Modal */}
      <DealAnalysisModal
        visible={aiModalVisible}
        loading={aiLoading}
        result={aiResult}
        error={aiError}
        onClose={() => setAiModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingBottom: 24,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 120,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 320,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    gap: 16,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  brandPill: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  brandText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  categoryPill: {
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  productName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 34,
  },
  priceHighlight: {
    backgroundColor: "#F0FDF4",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#10B981",
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EF4444",
    textTransform: "uppercase",
  },
  priceValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: "800",
    color: "#059669",
    lineHeight: 50,
  },
  originalPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  priceSubtext: {
    fontSize: 13,
    color: "#6B7280",
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#6366F1", // Indigo for AI vibes
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
});