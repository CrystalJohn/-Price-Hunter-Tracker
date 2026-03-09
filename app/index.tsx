import { Redirect } from "expo-router";

export default function Index() {
  // Go directly to home page without requiring authentication
  return <Redirect href="/(tabs)" />;
}
