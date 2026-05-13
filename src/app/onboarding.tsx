import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSession } from "@/lib/auth/session";

const pillars = [
  {
    icon: "wifi-off",
    title: "Works offline",
    body: "Keep scans, references, treatments, and guide snippets ready for the field.",
  },
  {
    icon: "image-search-outline",
    title: "Evidence first",
    body: "Every scan shows nearby verified examples and a confidence breakdown.",
  },
  {
    icon: "account-lock-outline",
    title: "No account setup",
    body: "Start with a private anonymous Supabase session. Add identity later when needed.",
  },
] as const;

export default function OnboardingScreen() {
  const { signIn, isSigningIn, error } = useSession();

  const continueAsGuest = async () => {
    const signedIn = await signIn();

    if (signedIn) {
      router.replace("/(tabs)");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="flex-grow px-5 pb-safe-or-8 pt-safe-or-8">
      <View className="flex-1 justify-between gap-8">
        <View className="gap-6">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-primary-muted">
            <MaterialCommunityIcons className="text-primary" name="leaf-circle-outline" size={48} />
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold uppercase text-foreground-secondary">Plant-AI</Text>
            <Text className="text-4xl font-bold leading-tight text-foreground">
              Crop help that stays with you in the field.
            </Text>
            <Text className="text-lg leading-normal text-foreground-secondary">
              Diagnose leaf problems, review trusted evidence, and save field notes before the network comes back.
            </Text>
          </View>

          <View className="gap-3">
            {pillars.map((item) => (
              <View className="flex-row gap-3 rounded-lg border border-border bg-card p-4" key={item.title}>
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-muted">
                  <MaterialCommunityIcons className="text-primary" name={item.icon} size={24} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground">{item.title}</Text>
                  <Text className="text-sm leading-normal text-foreground-secondary">{item.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3">
          {error ? (
            <View className="rounded-lg bg-danger-muted p-3">
              <Text className="text-sm leading-normal text-foreground">{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSigningIn}
            onPress={continueAsGuest}
            className="h-14 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5 active:opacity-85 disabled:opacity-50"
          >
            {isSigningIn ? <ActivityIndicator className="text-primary-on" /> : null}
            <Text className="text-base font-semibold text-primary-on">
              {isSigningIn ? "Starting..." : "Continue"}
            </Text>
          </Pressable>

          <Text className="text-center text-xs leading-normal text-foreground-muted">
            Anonymous auth creates an authenticated Supabase user without collecting email or phone.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
