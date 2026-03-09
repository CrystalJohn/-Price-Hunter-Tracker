import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Product } from "../../types/domain";

type Props = {
  product: Product;
  lowestPrice?: number | null;
  onPress?: () => void;
};

function ProductCardBase({ product, lowestPrice, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.brand}>
          {product.brand}
        </Text>
      </View>
      <View style={styles.priceBox}>
        <Text style={styles.priceLabel}>Lowest</Text>
        <Text style={styles.priceValue}>
          {lowestPrice == null ? "—" : `€${lowestPrice.toFixed(2)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export const ProductCard = React.memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 6,
    elevation: 1,
  },
  image: { width: 72, height: 72, borderRadius: 6, backgroundColor: "#F3F4F6" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "600" },
  brand: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  priceBox: { alignItems: "flex-end", marginLeft: 12 },
  priceLabel: { fontSize: 12, color: "#6B7280" },
  priceValue: { fontSize: 16, fontWeight: "700", marginTop: 4 },
});
