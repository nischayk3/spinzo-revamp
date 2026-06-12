import { View, Text } from "react-native";

export default function AddressesScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F7FC" }}>
      <Text style={{ fontFamily: "Outfit-Bold", fontSize: 24, color: "#0F172A" }}>Addresses</Text>
      <Text style={{ fontFamily: "Outfit-Regular", fontSize: 14, color: "#64748B", marginTop: 8 }}>Manage your delivery addresses</Text>
    </View>
  );
}
