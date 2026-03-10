import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProductList } from "../../src/components/product/ProductList";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ProductList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safeArea: { flex: 1 } });
