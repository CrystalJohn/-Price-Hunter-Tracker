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
        currentPrice: lowest ?? avg30,
        avgPrice: avg30,
        discountPercent,
        priceTrend,
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

                        {/* Brand Badge */}
              <View style={styles.brandBadge}>
                <Ionicons name="business-outline" size={14} color="#3B82F6" />
                <Text style={styles.brandText}>{product.brand}</Text>
              </View>

              {/* Product Name */}
              <Text style={styles.productName}>{product.name}</Text>

              {/* Lowest Price Highlight */}
              <View style={styles.priceHighlight}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Best Price</Text>
                  {lowest && (
                    <View style={styles.savingsBadge}>
                      <Ionicons
                        name="trending-down"
                        size={14}
                        color="#10B981"
                      />
                      <Text style={styles.savingsText}>Best Deal</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.priceValue}>
                  {lowest == null ? "—" : `€${lowest.toFixed(2)}`}
                </Text>
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
                  <Ionicons name="analytics-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Analyze Deal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={toggleFollow}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isFav ? "heart" : "heart-outline"}
                    size={20}
                    color={isFav ? "#EF4444" : "#3B82F6"}
                  />
                  <Text style={styles.secondaryButtonText}>
                    {isFav ? "Following" : "Follow"}
                  </Text>
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
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  brandText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  priceValue: {
    fontSize: 42,
    fontWeight: "800",
    color: "#059669",
    lineHeight: 50,
  },
  priceSubtext: {
    fontSize: 13,
    color: "#6B7280",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3B82F6",
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