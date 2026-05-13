import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useSession } from "@/lib/auth/session";

void SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return null;
}
