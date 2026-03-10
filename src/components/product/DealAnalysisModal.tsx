import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DealAnalysis } from "../../types/domain";

type Props = {
  visible: boolean;
  loading: boolean;
  result: DealAnalysis | null;
  error: string | null;
  onClose: () => void;
};

function getScoreColor(score: number): string {
  if (score >= 7) return "#10B981";
  if (score >= 4) return "#F59E0B";
  return "#EF4444";
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case "Good":
      return { bg: "#ECFDF5", text: "#059669" };
    case "Average":
      return { bg: "#FFFBEB", text: "#D97706" };
    case "Overpriced":
      return { bg: "#FEF2F2", text: "#DC2626" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280" };
  }
}

function getVerdictIcon(verdict: string): keyof typeof Ionicons.glyphMap {
  switch (verdict) {
    case "Good":
      return "checkmark-circle";
    case "Average":
      return "alert-circle";
    case "Overpriced":
      return "close-circle";
    default:
      return "help-circle";
  }
}

function DealAnalysisModalBase({
  visible,
  loading,
  result,
  error,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={22} color="#3B82F6" />
              <Text style={styles.headerTitle}>AI Deal Analysis</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>
                Analyzing deal with AI...
              </Text>
              <Text style={styles.loadingSubtext}>
                Powered by Google Gemini
              </Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="warning-outline"
                size={48}
                color="#EF4444"
              />
              <Text style={styles.errorTitle}>Analysis Failed</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {result && !loading && !error && (
            <View style={styles.resultContainer}>
              {/* Deal Score */}
              <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>Deal Score</Text>
                <View
                  style={[
                    styles.scoreCircle,
                    {
                      borderColor: getScoreColor(result.dealScore),
                      backgroundColor:
                        getScoreColor(result.dealScore) + "15",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreValue,
                      { color: getScoreColor(result.dealScore) },
                    ]}
                  >
                    {result.dealScore}
                  </Text>
                  <Text style={styles.scoreMax}>/10</Text>
                </View>
              </View>

              {/* Verdict Badge */}
              <View
                style={[
                  styles.verdictBadge,
                  {
                    backgroundColor: getVerdictStyle(result.verdict).bg,
                  },
                ]}
              >
                <Ionicons
                  name={getVerdictIcon(result.verdict)}
                  size={20}
                  color={getVerdictStyle(result.verdict).text}
                />
                <Text
                  style={[
                    styles.verdictText,
                    { color: getVerdictStyle(result.verdict).text },
                  ]}
                >
                  {result.verdict}
                </Text>
              </View>

              {/* Explanation */}
              <View style={styles.explanationBox}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color="#6B7280"
                />
                <Text style={styles.explanationText}>
                  {result.explanation}
                </Text>
              </View>

              {/* Gemini branding */}
              <View style={styles.brandingRow}>
                <Ionicons name="sparkles-outline" size={14} color="#9CA3AF" />
                <Text style={styles.brandingText}>
                  Powered by Google Gemini AI
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export const DealAnalysisModal = React.memo(DealAnalysisModalBase);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 320,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  // Loading
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  loadingSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  // Error
  errorContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  // Result
  resultContainer: {
    alignItems: "center",
    gap: 20,
  },
  scoreSection: {
    alignItems: "center",
    gap: 8,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 2,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 48,
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 14,
  },
  // Verdict
  verdictBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  verdictText: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Explanation
  explanationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    width: "100%",
  },
  explanationText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  // Branding
  brandingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  brandingText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});
