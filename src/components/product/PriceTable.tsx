import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ProductPrice } from "../../types/domain";

type Props = { prices: ProductPrice[] };

export function PriceTable({ prices }: Props) {
  if (!prices || prices.length === 0) {
    return <Text style={styles.empty}>No price data available</Text>;
  }

  const best = prices.reduce(
    (prev, cur) => (cur.price < prev.price ? cur : prev),
    prices[0],
  );

  return (
    <View style={styles.table}>
      {prices.map((p) => {
        const isBest = p.id === best.id;
        return (
          <View key={p.id} style={[styles.row, isBest && styles.bestRow]}>
            <View style={styles.storeInfo}>
              <View style={[styles.storeIcon, isBest && styles.bestStoreIcon]}>
                <Ionicons
                  name="storefront-outline"
                  size={18}
                  color={isBest ? "#059669" : "#6B7280"}
                />
              </View>
              <Text style={[styles.storeText, isBest && styles.bestStoreText]}>
                {p.storeName || "Unknown Store"}
              </Text>
            </View>

            <View style={styles.priceInfo}>
              <Text style={[styles.priceText, isBest && styles.bestPriceText]}>
                €{p.price.toFixed(2)}
              </Text>
              {isBest && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🔥 Best Deal</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: "#6B7280",
    paddingVertical: 12,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  table: {
    marginTop: 4,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  bestRow: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
    borderWidth: 2,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  storeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  bestStoreIcon: {
    backgroundColor: "#D1FAE5",
  },
  storeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  bestStoreText: {
    color: "#065F46",
    fontWeight: "700",
  },
  priceInfo: {
    alignItems: "flex-end",
    gap: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  bestPriceText: {
    color: "#059669",
    fontSize: 20,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
