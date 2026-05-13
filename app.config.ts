import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "plant-ai",
  slug: "plant-ai",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "plantai",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: "com.jemishmalaviya.plantai",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.jemishmalaviya.plantai",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  extra: {
    supabaseUrl: process.env.EXPO_SUPABASE_URL ?? "",
    supabaseKey: process.env.EXPO_SUPABASE_KEY ?? "",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      },
    ],
    [
      "expo-sqlite",
      {
        enableFTS: true,
        useSQLCipher: true,
      },
    ],
    ["expo-build-properties"],
    "onnxruntime-react-native",
    [
      "llama.rn",
      {
        enableEntitlements: true,
        entitlementsProfile: "production",
        forceCxx20: true,
        enableOpenCLAndHexagon: true,
      },
    ],
  ],
});
