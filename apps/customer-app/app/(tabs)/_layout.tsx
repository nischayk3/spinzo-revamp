import { useEffect } from "react";
import { Tabs, useSegments, useRouter } from "expo-router";
import { Platform } from "react-native";
import { Home, ShoppingBag, Wallet, User } from "lucide-react-native";
import { useAuth } from "../_authContext";

const PROTECTED_TABS = ["orders", "credits", "profile"];

export default function TabsLayout() {
  const { isAuthenticated, isGuest } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const currentTab = segments[1];
    // Protected tabs require full auth — guest users also get redirected
    if (currentTab && PROTECTED_TABS.includes(currentTab) && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [segments, isAuthenticated, isGuest]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8e51ff",
        tabBarInactiveTintColor: "#71717B",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E4E4E7",
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          height: Platform.OS === "ios" ? 80 : 64,
        },
        tabBarLabelStyle: {
          fontFamily: "Outfit-Medium",
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <ShoppingBag size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="credits"
        options={{
          title: "Credits",
          tabBarIcon: ({ color }) => <Wallet size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
