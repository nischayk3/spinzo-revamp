import { useState, useRef, useCallback } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../_authContext";

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { signIn } = useAuth();
  const { phone = "9876543210" } = useLocalSearchParams<{ phone: string }>();
  const { width: W } = useWindowDimensions();
  const maxW = Platform.OS === "web" ? Math.min(W, 480) : W;
  const allFilled = otp.every((d) => d !== "");

  const handleChange = useCallback((text: string, index: number) => {
    const next = [...otp];
    next[index] = text;
    setOtp(next);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
  }, [otp]);

  const handleKey = useCallback((key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length === 6) {
      const result = await signIn(phone, code);
      if (result === "existing") {
        router.replace("/(tabs)/");
      } else {
        router.replace("/(auth)/create-account");
      }
    }
  }, [otp, phone, signIn, router]);

  const formatPhone = (p: string) => {
    const clean = p.replace(/\D/g, "");
    if (clean.length >= 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5, 10)}`;
    }
    return `+91 ${clean}`;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#FFFFFF" }} behavior="padding">
      <ScrollView
        bounces={false}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: maxW, flex: 1 }}>
          {/* Purple gradient header */}
          <View style={{ height: "28%", minHeight: 200, position: "relative" }}>
            <LinearGradient
              colors={["#8e51ff", "#6d3fd1"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ flex: 1 }}
            />
            <View style={{ position: "absolute", top: 40, left: -40, width: 112, height: 112, borderRadius: 56, backgroundColor: "rgba(255,255,255,0.1)" }} />
            <View style={{ position: "absolute", top: 64, right: 0, width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.1)" }} />

            {/* Back button */}
            <TouchableOpacity onPress={() => router.back()} style={{ position: "absolute", left: 40, top: 96, padding: 12, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999 }}>
              <Text style={{ color: "#fff", fontSize: 20 }}>←</Text>
            </TouchableOpacity>

            {/* Center badge */}
            <View style={{ position: "absolute", left: 0, right: 0, top: 40, alignItems: "center" }}>
              <View style={{ alignItems: "center", gap: 12 }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#fff", letterSpacing: 0.5 }}>SpinZo</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>👕</Text>
                  <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>🧺</Text>
                  <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>✨</Text>
                </View>
              </View>
            </View>

            {/* Progress dots */}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ width: 40, height: 12, borderRadius: 6, backgroundColor: "#fff" }} />
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.35)" }} />
              </View>
            </View>
          </View>

          {/* White bottom sheet */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              marginTop: -24,
              shadowColor: "rgba(124,58,237,0.08)",
              shadowOffset: { width: 0, height: -12 },
              shadowOpacity: 1,
              shadowRadius: 40,
              elevation: 8,
            }}
          >
            <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: "#F1F5F9", alignSelf: "center", marginTop: 12 }} />

            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20, justifyContent: "space-between" }}>
              {/* Title */}
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ fontFamily: "Outfit-Bold", fontSize: 26, color: "#0F172A", letterSpacing: -0.5 }}>Verify Your Number</Text>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 14, color: "#71717B" }}>Enter the 6-digit OTP sent to</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#8e51ff" }}>{formatPhone(phone)}</Text>
                  <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 14, color: "#8e51ff" }}>✏️</Text>
                    <Text style={{ fontFamily: "Outfit-Medium", fontSize: 12, color: "#8e51ff" }}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* OTP inputs */}
              <View style={{ alignItems: "center", gap: 20 }}>
                <View style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(ref) => { inputRefs.current[i] = ref; }}
                      style={{
                        width: 50,
                        height: 58,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: digit ? "#8e51ff" : "#E2E8F0",
                        backgroundColor: digit ? "rgba(142,81,255,0.03)" : "#fff",
                        textAlign: "center",
                        fontSize: 26,
                        fontFamily: "Outfit-Bold",
                        color: "#0F172A",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 1,
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(t) => handleChange(t, i)}
                      onKeyPress={({ nativeEvent }) => handleKey(nativeEvent.key, i)}
                    />
                  ))}
                </View>

                {/* Verification status */}
                {allFilled && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0FDF4", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 16, color: "#16A34A" }}>✓</Text>
                    <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#16A34A" }}>Verification ready</Text>
                  </View>
                )}

                {/* Resend timer */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 16, color: "#8e51ff" }}>🕐</Text>
                  <Text style={{ fontFamily: "Outfit-Regular", fontSize: 14, color: "#71717B" }}>Resend OTP in 00:28</Text>
                </View>
              </View>

              {/* Verify button */}
              <View style={{ gap: 16, paddingBottom: 16 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleVerify}
                  disabled={!allFilled}
                  style={{
                    borderRadius: 14,
                    opacity: allFilled ? 1 : 0.6,
                    shadowColor: "#8e51ff",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: allFilled ? 0.2 : 0,
                    shadowRadius: 24,
                    elevation: allFilled ? 6 : 0,
                  }}
                >
                  <LinearGradient
                    colors={["#8e51ff", "#a56eff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                  >
                    <Text style={{ fontSize: 20, color: "#f5f0ff" }}>🛡️</Text>
                    <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 16, color: "#f5f0ff" }}>Verify & Continue</Text>
                    <Text style={{ fontSize: 16, color: "#f5f0ff" }}>→</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: "center" }}>
                  <Text style={{ fontFamily: "Outfit-Regular", fontSize: 14, color: "#71717B" }}>
                    Having trouble?{" "}
                    <Text style={{ fontFamily: "Outfit-Medium", color: "#8e51ff", textDecorationLine: "underline" }}>Contact Support</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
