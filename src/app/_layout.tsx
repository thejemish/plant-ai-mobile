import "@/global.css";
import "@/lib/supastash";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaListener, SafeAreaProvider } from "react-native-safe-area-context";
import { useSupastash, useSupastashFilters } from "supastash";
import { Uniwind } from "uniwind";
import { SessionProvider, useSession } from "@/lib/auth/session";
import { SplashScreenController } from "@/lib/auth/splash";
import { useHydrateStores } from "@/store/use-hydrate";
import { useSettingsStore } from "@/store/use-settings";

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();
  const { dbReady } = useSupastash();

  useHydrateStores();
  useSettingsController(dbReady);

  return (
    <SafeAreaProvider>
      <SplashScreenController dbReady={dbReady} />
      {session ? <AuthenticatedSupastashFilters userId={session.user.id} /> : null}
      <SafeAreaListener
        onChange={({ insets }) => {
          Uniwind.updateInsets(insets);
        }}
      >
        {!dbReady || isLoading ? (
          <View className="flex-1 bg-background" />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={Boolean(session)}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="scan/preview" />
              <Stack.Screen name="scan/result/[id]" />
              <Stack.Screen name="scan/symptoms" />
              <Stack.Screen name="treatment/[scanId]" />
              <Stack.Screen name="treatment/[scanId]/dosage" />
              <Stack.Screen name="advisor/ask/[threadId]" />
              <Stack.Screen name="advisor/library" />
              <Stack.Screen name="advisor/library/[docId]" />
              <Stack.Screen name="advisor/pests" />
              <Stack.Screen name="advisor/pests/[id]" />
              <Stack.Screen name="advisor/calendar" />
              <Stack.Screen name="fields/new" />
              <Stack.Screen name="fields/[id]" />
              <Stack.Screen name="fields/[id]/scan/[scanId]" />
              <Stack.Screen name="me/language" />
              <Stack.Screen name="me/history" />
              <Stack.Screen name="me/history/[id]" />
              <Stack.Screen name="me/storage" />
              <Stack.Screen name="me/about" />
              <Stack.Screen name="model-setup" options={{ presentation: "modal" }} />
            </Stack.Protected>

            <Stack.Protected guard={!session}>
              <Stack.Screen name="onboarding" />
            </Stack.Protected>
          </Stack>
        )}
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}

function useSettingsController(dbReady: boolean) {
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings);
  const theme = useSettingsStore((state) => state.theme);

  React.useEffect(() => {
    if (dbReady) {
      void hydrateSettings();
    }
  }, [dbReady, hydrateSettings]);

  React.useEffect(() => {
    Uniwind.setTheme(theme);
  }, [theme]);
}

function AuthenticatedSupastashFilters({ userId }: { userId: string }) {
  useSupastashFilters({
    fields: [{ column: "user_id", operator: "eq", value: userId }],
    scans: [{ column: "user_id", operator: "eq", value: userId }],
    action_progress: [{ column: "user_id", operator: "eq", value: userId }],
    ask_threads: [{ column: "user_id", operator: "eq", value: userId }],
    ask_messages: [{ column: "user_id", operator: "eq", value: userId }],
  });

  return null;
}
