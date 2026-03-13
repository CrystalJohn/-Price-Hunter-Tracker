import React, { useRef } from "react";
import { Image, StyleSheet, Text, View, Pressable, Animated } from "react-native";
import type { Product } from "../../types/domain";

type Props = {
  product: Product;
  lowestPrice?: number | null;
  originalPrice?: number | null;
  bestStoreName?: string;
  onPress?: () => void;
};

function ProductCardBase({ product, lowestPrice, originalPrice, bestStoreName, onPress }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  let discountPercent = 0;
  if (lowestPrice && originalPrice && originalPrice > lowestPrice) {
    discountPercent = Math.round(((originalPrice - lowestPrice) / originalPrice) * 100);
  }

  const badgeText = bestStoreName ? bestStoreName : "Lowest";

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardInner}
      >
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.name}>
            {product.name}
          </Text>
          <Text numberOfLines={1} style={styles.brand}>
            {product.brand}
          </Text>
          {discountPercent > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Save {discountPercent}%</Text>
            </View>
          )}
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel} numberOfLines={1}>
            {lowestPrice == null ? "Price" : badgeText}
          </Text>
          <Text style={styles.priceValue}>
            {lowestPrice == null ? "—" : `€${lowestPrice.toFixed(2)}`}
          </Text>
          {discountPercent > 0 && originalPrice && (
            <Text style={styles.originalPrice}>€{originalPrice.toFixed(2)}</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const ProductCard = React.memo(ProductCardBase);

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: { 
    width: 80, 
    height: 80, 
    borderRadius: 12, 
    backgroundColor: "#F3F4F6" 
  },
  info: { 
    flex: 1, 
    marginLeft: 14,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  name: { 
    fontSize: 16, 
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  brand: { 
    fontSize: 13, 
    color: "#64748B", 
    fontWeight: "500",
  },
  badge: {
    marginTop: 6,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EF4444",
    textTransform: "uppercase",
  },
  priceBox: { 
    alignItems: "flex-end", 
    marginLeft: 12 
  },
  priceLabel: { 
    fontSize: 12, 
    color: "#3B82F6",
    fontWeight: "700",
    letterSpacing: 0.2,
    maxWidth: 90,
  },
  priceValue: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#059669",
    marginTop: 2,
  },
  originalPrice: {
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
});
