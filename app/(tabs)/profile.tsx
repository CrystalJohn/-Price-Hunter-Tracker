// useRouter hook will be used instead of importing router directly
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getProfile, uploadAvatar } from "../../src/lib/profileService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router"; // Added useRouter import
import { useState } from "react"; // Added useState import

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, signOut, isAuthenticated } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // Fetch avatar profile (hook runs unconditionally; network call disabled until user exists)
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user?.id,
  });

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
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

  const handlePickImage = async () => {
    if (!user) return;

    // Ask for permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access gallery is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (pickerResult.canceled) return;

    const uri = pickerResult.assets[0].uri;

    setUploadingAvatar(true);
    try {
      await uploadAvatar(user.id, uri);
      await refetchProfile();
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}
            disabled={uploadingAvatar}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person-outline" size={40} color="#9CA3AF" />
            )}

            {uploadingAvatar && (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            )}

            {!uploadingAvatar && (
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {user?.email?.split("@")[0] || "User"}
            </Text>
            <Text style={styles.email}>
              {user?.email || "user@example.com"}
            </Text>
          </View>
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
    flexDirection: "row", // Changed to row
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingHorizontal: 20, // Added horizontal padding
  },
  avatarContainer: {
    width: 80, // Changed width
    height: 80, // Changed height
    borderRadius: 40, // Changed borderRadius
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16, // Added margin
    borderWidth: 3,
    borderColor: "#3B82F6",
    position: "relative", // Added position
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3B82F6",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userInfo: {
    flex: 1,
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
    height: 40, // Changed height back to 40
    borderRadius: 20, // Changed borderRadius back to 20
    backgroundColor: "#F9FAFB", // Changed color back to F9FAFB
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12, // Changed margin back to 12
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
