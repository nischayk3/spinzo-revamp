import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SplashScreen } from "expo-router";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from "@expo-google-fonts/outfit";
import { AuthProvider, useAuth as useSrcAuth } from "../src/providers/AuthProvider";
import { AuthContextProvider } from "./_authContext";

SplashScreen.preventAutoHideAsync();

function AuthContextBridge({ children }: { children: React.ReactNode }) {
  const auth = useSrcAuth();
  return <AuthContextProvider value={auth}>{children}</AuthContextProvider>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Outfit-Regular": Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
    "Outfit-ExtraBold": Outfit_800ExtraBold,
    "Outfit-Black": Outfit_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#8e51ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Platform.OS === "web" ? "#F8F7FC" : "#FFFFFF" }}>
      <StatusBar style="dark" />
      <AuthProvider>
        <AuthContextBridge>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(modals)" options={{ presentation: "modal" }} />
            <Stack.Screen name="product/[productId]" />
            <Stack.Screen name="cart/index" />
            <Stack.Screen name="cart/checkout" />
          </Stack>
        </AuthContextBridge>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
