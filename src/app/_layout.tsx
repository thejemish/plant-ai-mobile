import "@/global.css";
import "@/lib/supastash";
import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider, SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
import { SessionProvider, useSession } from "@/lib/auth/session";
import { SplashScreenController } from "@/lib/auth/splash";

export default function RootLayout() {
  return (
    <SessionProvider>
      <SplashScreenController />
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session } = useSession();

  return (
    <SafeAreaProvider>
      <SafeAreaListener
        onChange={({ insets }) => {
          Uniwind.updateInsets(insets);
        }}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={Boolean(session)}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="scan/result/[id]" />
          </Stack.Protected>

          <Stack.Protected guard={!session}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
        </Stack>
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}
