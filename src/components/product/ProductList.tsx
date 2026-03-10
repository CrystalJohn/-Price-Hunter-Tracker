import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { ProductCard } from "./ProductCard";
import type { Product, ProductPrice } from "../../types/domain";
import { useRouter } from "expo-router";
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
    .select("*");
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

  const items = useMemo(() => {
    if (!data) return [];
    const { products, prices } = data;

    // compute lowest price per product
    const priceMap = new Map<string, number>();
    prices.forEach((p) => {
      const prev = priceMap.get(p.productId);
      if (prev == null || p.price < prev) priceMap.set(p.productId, p.price);
    });

    const list = products.map((prod) => ({
      product: prod,
      lowestPrice: priceMap.get(prod.id) ?? null,
    }));

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = normalizedQuery
      ? list.filter((l) =>
          l.product.name.toLowerCase().includes(normalizedQuery),
        )
      : list;

    // sort low -> high (nulls at end)
    filtered.sort((a, b) => {
      if (a.lowestPrice == null && b.lowestPrice == null) return 0;
      if (a.lowestPrice == null) return 1;
      if (b.lowestPrice == null) return -1;
      return a.lowestPrice - b.lowestPrice;
    });

    return filtered;
  }, [data, searchQuery]);

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
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <ProductCard
            product={item.product}
            lowestPrice={item.lowestPrice ?? undefined}
            onPress={() => router.push(`/product/${item.product.id}`)}
          />
        )}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
});