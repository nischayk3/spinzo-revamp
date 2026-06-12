import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../_authContext";

export default function CheckoutScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F7FC" }}>
      <Text style={{ fontFamily: "Outfit-Bold", fontSize: 24, color: "#0F172A" }}>Checkout</Text>
      <Text style={{ fontFamily: "Outfit-Regular", fontSize: 14, color: "#64748B", marginTop: 8 }}>Complete your order</Text>
    </View>
  );
}
