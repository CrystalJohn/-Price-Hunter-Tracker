import React from "react";
import { Dimensions, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import type { PriceHistory } from "../../types/domain";

type Props = { history: PriceHistory[] };

export function PriceHistoryChart({ history }: Props) {
  const width = Dimensions.get("window").width - 32;
  if (!history || history.length === 0) return null;

  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const labels = sorted.map((h) => new Date(h.recordedAt).toLocaleDateString());
  const data = sorted.map((h) => h.price);

  return (
    <View style={{ marginTop: 12 }}>
      <LineChart
        data={{ labels, datasets: [{ data }] }}
        width={width}
        height={220}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: () => `#2563EB`,
          labelColor: () => "#6B7280",
          decimalPlaces: 2,
        }}
        bezier
        withDots={false}
        withInnerLines={false}
      />
    </View>
  );
}
