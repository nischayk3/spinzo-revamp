import { useEffect } from "react";
import { Stack, useSegments, useRouter } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Profile" }} />
      <Stack.Screen name="addresses" options={{ title: "Addresses" }} />
      <Stack.Screen name="addresses/new" options={{ title: "Add Address" }} />
    </Stack>
  );
}
