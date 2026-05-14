import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useSession } from "@/lib/auth/session";

void SplashScreen.preventAutoHideAsync();

export function SplashScreenController({ dbReady }: { dbReady: boolean }) {
  const { isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && dbReady) {
      void SplashScreen.hideAsync();
    }
  }, [dbReady, isLoading]);

  return null;
}
