import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { ProductCard } from "./ProductCard";
import type { Product, ProductPrice } from "../../types/domain";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

async function fetchProducts() {
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("*");
  if (pErr) {
    console.error("Supabase(products) error:", pErr);
    throw new Error(pErr.message ?? JSON.stringify(pErr));
  }

  const { data: prices, error: prErr } = await supabase
    .from("product_prices")
    .select("*, stores(name)");
  if (prErr) {
    console.error("Supabase(product_prices) error:", prErr);
    throw new Error(prErr.message ?? JSON.stringify(prErr));
  }

  // Map DB snake_case -> camelCase expected by the app types
  const mappedProducts = (products ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    imageUrl: p.image_url ?? p.imageUrl,
    createdAt: p.created_at ?? p.createdAt,
  }));

  const mappedPrices = (prices ?? []).map((r: any) => ({
    id: r.id,
    productId: r.product_id ?? r.productId,
    storeId: r.store_id ?? r.storeId,
    storeName: r.stores?.name ?? r.store_name ?? r.storeName,
    price: Number(r.price),
    updatedAt: r.updated_at ?? r.updatedAt,
  }));

  return { products: mappedProducts, prices: mappedPrices };
}

export function ProductList() {
  const router = useRouter();
  const { data, isLoading } = useQuery<
    { products: Product[]; prices: ProductPrice[] },
    Error,
    { products: Product[]; prices: ProductPrice[] }
  >({
    queryKey: ["products-with-prices"],
    queryFn: fetchProducts,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      setSelectedBrand(null);
      setSearchQuery("");
    }, [])
  );

  const brands = useMemo(() => {
    if (!data?.products?.length) return [] as string[];
    const unique = new Set(
      data.products
        .map((p) => (p.brand ?? "").trim())
        .filter((b) => b.length > 0),
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const items = useMemo(() => {
    if (!data) return [];
    const { products, prices } = data;

    // compute lowest and highest price per product
    const priceMap = new Map<string, { min: number; max: number; storeName?: string }>();
    prices.forEach((p) => {
      const prev = priceMap.get(p.productId);
      if (!prev) {
        priceMap.set(p.productId, { min: p.price, max: p.price, storeName: p.storeName });
      } else {
        if (p.price < prev.min) {
          prev.min = p.price;
          prev.storeName = p.storeName;
        }
        prev.max = Math.max(prev.max, p.price);
      }
    });

    const list = products.map((prod) => {
      const pData = priceMap.get(prod.id);
      return {
        product: prod,
        lowestPrice: pData?.min ?? null,
        highestPrice: pData?.max ?? null,
        bestStoreName: pData?.storeName ?? undefined,
      };
    });

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedBrand = selectedBrand
      ? selectedBrand.trim().toLowerCase()
      : "";

    const filtered = list.filter((l) => {
      const matchesQuery = normalizedQuery
        ? l.product.name.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesBrand = normalizedBrand
        ? l.product.brand.toLowerCase().includes(normalizedBrand)
        : true;
      return matchesQuery && matchesBrand;
    });

    // sort low -> high (nulls at end)
    filtered.sort((a, b) => {
      if (a.lowestPrice == null && b.lowestPrice == null) return 0;
      if (a.lowestPrice == null) return 1;
      if (b.lowestPrice == null) return -1;
      return a.lowestPrice - b.lowestPrice;
    });

    return filtered;
  }, [data, searchQuery, selectedBrand]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      {brands.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              !selectedBrand ? styles.chipActive : undefined,
            ]}
            onPress={() => setSelectedBrand(null)}
          >
            <Text
              style={[
                styles.chipText,
                !selectedBrand ? styles.chipTextActive : undefined,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {brands.map((brand) => {
            const isActive = selectedBrand === brand;
            return (
              <TouchableOpacity
                key={brand}
                style={[styles.chip, isActive ? styles.chipActive : undefined]}
                onPress={() => setSelectedBrand(isActive ? null : brand)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive ? styles.chipTextActive : undefined,
                  ]}
                >
                  {brand}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.listWrapper}>
        <FlashList
          data={items}
          renderItem={({ item }) => (
            <ProductCard
              product={item.product}
              lowestPrice={item.lowestPrice ?? undefined}
              originalPrice={item.highestPrice ?? undefined}
              bestStoreName={item.bestStoreName}
              onPress={() => router.push(`/product/${item.product.id}`)}
            />
          )}
          // @ts-ignore - Valid prop, but types are missing in this environment
          estimatedItemSize={110}
          keyExtractor={(item) => item.product.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listWrapper: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 12,
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
  chipsScroll: {
    maxHeight: 50,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignSelf: "flex-start",
  },
  chipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chipText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 14,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
});