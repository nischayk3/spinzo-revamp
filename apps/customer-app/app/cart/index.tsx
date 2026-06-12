import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../_authContext";

export default function CartScreen() {
  const { isAuthenticated, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isGuest) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isGuest]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F7FC" }}>
      <Text style={{ fontFamily: "Outfit-Bold", fontSize: 24, color: "#0F172A" }}>Cart</Text>
      <Text style={{ fontFamily: "Outfit-Regular", fontSize: 14, color: "#64748B", marginTop: 8 }}>Your cart is empty</Text>
    </View>
  );
}
