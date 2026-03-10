import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { resetAuth } from "../../src/lib/authDebug";

export default function ProfileScreen() {
  const { signOut, user, isAuthenticated, loading } = useAuth();

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notAuthContainer}>
          <View style={styles.notAuthIconContainer}>
            <Ionicons name="person-circle-outline" size={120} color="#D1D5DB" />
          </View>
          <Text style={styles.notAuthTitle}>Sign In Required</Text>
          <Text style={styles.notAuthSubtitle}>
            Please sign in to view your profile and manage your account
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signUpTextButton}
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <Text style={styles.signUpText}>
              Don't have an account?{" "}
              <Text style={styles.signUpTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSignOut = async (): Promise<void> => {
    // For web, Alert.alert doesn't work well, so use window.confirm
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");

      if (confirmed) {
        try {
          await signOut();
        } catch (error) {
          console.error("Error during sign out:", error);
          window.alert("Failed to sign out. Please try again.");
        }
      }
      return;
    }

    // For native platforms, use Alert.alert
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Error during sign out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleDebugReset = async (): Promise<void> => {
    // For web, use window.confirm
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "🔧 Debug: Reset Auth\n\nThis will:\n• Sign you out\n• Clear all auth storage\n• Reset session\n\nUseful for fixing 400 errors.",
      );

      if (confirmed) {
        try {
          await resetAuth();
          window.alert("✅ Success - Auth reset complete.");
        } catch (error) {
          window.alert(`❌ Error - Failed to reset: ${error}`);
        }
      }
      return;
    }

    // For native platforms, use Alert.alert
    Alert.alert(
      "🔧 Debug: Reset Auth",
      "This will:\n• Sign you out\n• Clear all auth storage\n• Reset session\n\nUseful for fixing 400 errors.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetAuth();
              Alert.alert("✅ Success", "Auth reset complete.");
              // No need to redirect - the screen will show sign-in prompt automatically
            } catch (error) {
              Alert.alert("❌ Error", `Failed to reset: ${error}`);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#3B82F6" />
          </View>
          <Text style={styles.name}>
            {user?.email?.split("@")[0] || "User"}
          </Text>
          <Text style={styles.email}>{user?.email || "user@example.com"}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={24} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#6B7280"
              />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="settings-outline" size={24} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Debug Menu Item - Only for development */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.menuItem, styles.debugMenuItem]}
              onPress={handleDebugReset}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="bug-outline" size={24} color="#EF4444" />
              </View>
              <Text style={[styles.menuText, styles.debugText]}>
                Debug: Reset Auth
              </Text>
              <Ionicons name="warning-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 24,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#3B82F6",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  signOutButton: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
  debugMenuItem: {
    backgroundColor: "#FEF2F2",
    borderBottomColor: "#FCA5A5",
  },
  debugText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  notAuthIconContainer: {
    marginBottom: 24,
  },
  notAuthTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  notAuthSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  signInButton: {
    flexDirection: "row",
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  signUpTextButton: {
    padding: 8,
  },
  signUpText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signUpTextBold: {
    color: "#3B82F6",
    fontWeight: "600",
  },
});
