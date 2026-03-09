import { SafeAreaView, StyleSheet } from "react-native";
import { ProductList } from "../../src/components/product/ProductList";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ProductList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safeArea: { flex: 1 } });
