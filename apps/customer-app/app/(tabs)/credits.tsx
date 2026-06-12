import { View, Text } from "react-native";

export default function CreditsScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F7FC" }}>
      <Text style={{ fontFamily: "Outfit-Bold", fontSize: 24, color: "#0F172A" }}>Credits</Text>
      <Text style={{ fontFamily: "Outfit-Regular", fontSize: 14, color: "#64748B", marginTop: 8 }}>Your subscription credits will appear here</Text>
    </View>
  );
}
