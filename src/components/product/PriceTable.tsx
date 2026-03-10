import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ProductPrice } from "../../types/domain";

type Props = { prices: ProductPrice[] };

export function PriceTable({ prices }: Props) {
  if (!prices || prices.length === 0) {
    return <Text style={styles.empty}>No price data</Text>;
  }

  const best = prices.reduce(
    (prev, cur) => (cur.price < prev.price ? cur : prev),
    prices[0],
  );

  return (
    <View style={styles.table}>
      {prices.map((p) => (
        <View
          key={p.id}
          style={[styles.row, p.id === best.id ? styles.bestRow : null]}
        >
          <Text style={styles.store}>{p.storeName ?? p.storeId}</Text>
          <Text style={styles.price}>€{p.price.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: "#6B7280", padding: 8 },
  table: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  bestRow: { backgroundColor: "#ECFCCB", borderRadius: 6 },
  store: { fontSize: 14 },
  price: { fontWeight: "700" },
});
