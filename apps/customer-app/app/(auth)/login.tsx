import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../_authContext";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const router = useRouter();
  const { continueAsGuest } = useAuth();
  const { width: W } = useWindowDimensions();
  const maxW = Platform.OS === "web" ? Math.min(W, 480) : W;
  const isValid = phone.length >= 10;

  const handleNext = useCallback(() => {
    if (isValid) {
      router.push({ pathname: "/(auth)/verify-otp", params: { phone } });
    }
  }, [isValid, phone, router]);

  const handleGuest = useCallback(() => {
    continueAsGuest();
    router.replace("/(tabs)/");
  }, [continueAsGuest, router]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#FFFFFF" }} behavior="padding">
      <ScrollView
        bounces={false}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: maxW, flex: 1 }}>
          {/* Purple gradient header */}
          <View style={{ height: "30%", minHeight: 220, position: "relative" }}>
            <LinearGradient
              colors={["#8e51ff", "#6d3fd1", "#5a2eb8"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ flex: 1 }}
            />
            {/* Decorative blur rings */}
            <View style={{ position: "absolute", top: 40, left: -40, width: 112, height: 112, borderRadius: 56, backgroundColor: "rgba(255,255,255,0.1)" }} />
            <View style={{ position: "absolute", top: 64, right: -32, width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.1)" }} />
            {/* Small decorative dots */}
            <View style={{ position: "absolute", left: 32, top: 96, width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.4)" }} />
            <View style={{ position: "absolute", right: 48, top: 112, width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" }} />
            {/* SpinZo badge */}
            <View style={{ position: "absolute", left: 64, top: 160, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16 }}>🧺</Text>
              </View>
              <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#fff", letterSpacing: 0.5 }}>SpinZo</Text>
            </View>
            {/* Small icons */}
            <View style={{ position: "absolute", left: 40, top: 112, flexDirection: "row", gap: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>👕</Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>✨</Text>
            </View>
            <View style={{ position: "absolute", right: 40, top: 144, flexDirection: "row", gap: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>✨</Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>👕</Text>
            </View>
          </View>

          {/* White bottom sheet */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              marginTop: -20,
              shadowColor: "rgba(124,58,237,0.08)",
              shadowOffset: { width: 0, height: -12 },
              shadowOpacity: 1,
              shadowRadius: 40,
              elevation: 8,
            }}
          >
            {/* Handle */}
            <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: "#F1F5F9", alignSelf: "center", marginTop: 12 }} />

            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, justifyContent: "space-between" }}>
              {/* Title */}
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ fontFamily: "Outfit-Bold", fontSize: 28, color: "#0F172A", letterSpacing: -0.5 }}>Welcome to SpinZo</Text>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 14, color: "#71717B", textAlign: "center", maxWidth: 280, lineHeight: 20 }}>
                  Sign in to track orders, earn credits & more
                </Text>
              </View>

              {/* Phone input */}
              <View style={{ gap: 20 }}>
                <View style={{ gap: 8 }}>
                  <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#0F172A" }}>Mobile Number</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isValid ? "#8e51ff" : "#E2E8F0",
                      backgroundColor: "#fff",
                      paddingHorizontal: 12,
                      height: 56,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F5F0FF", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                      <Text style={{ fontSize: 16 }}>🇮🇳</Text>
                      <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#8e51ff" }}>+91</Text>
                    </View>
                    <TextInput
                      style={{ flex: 1, fontFamily: "Outfit-Regular", fontSize: 16, color: "#0F172A", height: "100%", marginLeft: 12 }}
                      placeholder="98765 43210"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </View>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 12, color: "#94A3B8" }}>We'll send a 6-digit OTP to verify your number</Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleNext}
                  disabled={!isValid}
                  style={{
                    borderRadius: 14,
                    opacity: isValid ? 1 : 0.5,
                    shadowColor: "#8e51ff",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: isValid ? 0.2 : 0,
                    shadowRadius: 24,
                    elevation: isValid ? 6 : 0,
                  }}
                >
                  <LinearGradient
                    colors={["#8e51ff", "#a56eff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                  >
                    <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 16, color: "#f5f0ff" }}>Send OTP</Text>
                    <Text style={{ fontSize: 16, color: "#f5f0ff" }}>→</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
                <Text style={{ fontFamily: "Outfit-Medium", fontSize: 11, color: "#71717B", letterSpacing: 4.8, textTransform: "uppercase" }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
              </View>

              {/* Guest button */}
              <TouchableOpacity
                onPress={handleGuest}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingVertical: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              >
                <Text style={{ fontSize: 16, color: "#8e51ff" }}>👤</Text>
                <Text style={{ fontFamily: "Outfit-Medium", fontSize: 15, color: "#8e51ff" }}>Continue as Guest</Text>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={{ fontFamily: "Outfit-Regular", fontSize: 11, color: "#94A3B8", textAlign: "center", lineHeight: 20, paddingBottom: 16 }}>
                By continuing, you agree to our{" "}
                <Text style={{ textDecorationLine: "underline", color: "#8e51ff" }}>Terms of Service</Text>{" "}
                &{" "}
                <Text style={{ textDecorationLine: "underline", color: "#8e51ff" }}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
