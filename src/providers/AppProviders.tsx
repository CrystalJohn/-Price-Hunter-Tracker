import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "../context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export function AppProviders({ children }: PropsWithChildren<{}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
