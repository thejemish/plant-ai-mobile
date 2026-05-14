import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/cn";

const tabLabels: Record<string, string> = {
  home: "Home",
  scan: "Scan",
  advisor: "Advisor",
  fields: "Fields",
  me: "Me",
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="scan" options={{ title: "Scan" }} />
      <Tabs.Screen name="advisor" options={{ title: "Advisor" }} />
      <Tabs.Screen name="fields" options={{ title: "Fields" }} />
      <Tabs.Screen name="me" options={{ title: "Me" }} />
    </Tabs>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View className="border-t border-border bg-card px-2 pb-safe-or-2 pt-2">
      <View className="flex-row items-end justify-between">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const iconClass = cn("text-foreground-muted", focused && "text-primary");

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : undefined}
              onPress={() => navigation.navigate(route.name)}
              className="min-h-12 flex-1 items-center justify-center py-1 active:opacity-80"
            >
              <TabIcon name={route.name} className={iconClass} />
              <Text
                className={cn(
                  "mt-1 text-xs text-foreground-muted",
                  focused && "font-semibold text-primary",
                )}
              >
                {tabLabels[route.name] ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ name, className }: { name: string; className: string }) {
  if (name === "scan") {
    return <MaterialCommunityIcons className={className} name="file-search-outline" size={24} />;
  }

  if (name === "advisor") {
    return <Ionicons className={className} name="chatbubble-ellipses-outline" size={23} />;
  }

  if (name === "fields") {
    return <MaterialCommunityIcons className={className} name="sprout-outline" size={24} />;
  }

  if (name === "me") {
    return <Ionicons className={className} name="settings-outline" size={23} />;
  }

  return <Ionicons className={className} name="home-outline" size={23} />;
}
