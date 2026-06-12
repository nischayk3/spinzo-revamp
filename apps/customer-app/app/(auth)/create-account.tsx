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

export default function CreateAccountScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [referral, setReferral] = useState("");
  const router = useRouter();
  const { completeProfile } = useAuth();
  const { width: W } = useWindowDimensions();
  const maxW = Platform.OS === "web" ? Math.min(W, 480) : W;
  const isValid = name.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (isValid) {
      await completeProfile(name, email || undefined);
      router.replace("/(tabs)/");
    }
  }, [isValid, name, email, completeProfile, router]);

  const genders = ["Male", "Female", "Prefer not to say"];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F5F3FF" }} behavior="padding">
      <ScrollView
        bounces={false}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: maxW, flex: 1, padding: 16, gap: 16 }}>
          {/* Header card */}
          <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, shadowColor: "rgba(124,58,237,0.08)", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20, color: "#0F172A" }}>←</Text>
              </TouchableOpacity>
              <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 17, color: "#0F172A", flex: 1, textAlign: "center" }}>Create Your Account</Text>
              <View style={{ width: 40 }} />
            </View>
          </View>

          {/* Progress card */}
          <View style={{ borderRadius: 999, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", padding: 16, shadowColor: "rgba(124,58,237,0.08)", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: "Outfit-Medium", fontSize: 11, color: "#71717B", letterSpacing: 3.5 }}>STEP 2 OF 2</Text>
              <Text style={{ fontFamily: "Outfit-Medium", fontSize: 11, color: "#7C3AED", letterSpacing: 0 }}>Almost done! Just a few details.</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: "#F1F5F9", marginTop: 12, overflow: "hidden" }}>
              <LinearGradient colors={["#8b5cf6", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: "100%", height: "100%", borderRadius: 4 }} />
            </View>
          </View>

          {/* Avatar upload */}
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <View style={{ position: "relative", width: 80, height: 80, borderRadius: 40, backgroundColor: "#F5F0FF", borderWidth: 2, borderColor: "#C4B5FD", borderStyle: "dashed", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 36, color: "#8b5cf6" }}>👤</Text>
              <TouchableOpacity style={{ position: "absolute", right: -4, bottom: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}>
                <Text style={{ fontSize: 16, color: "#fff" }}>📷</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form card */}
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", padding: 16, shadowColor: "rgba(124,58,237,0.08)", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 30, elevation: 4 }}>
            <View style={{ gap: 16 }}>
              {/* Full Name */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#0F172A" }}>Full Name</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 12, height: 50 }}>
                  <Text style={{ fontSize: 16, color: "#8b5cf6" }}>👤</Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: "Outfit-Regular", fontSize: 14, color: "#0F172A", height: "100%" }}
                    placeholder="e.g. Nischay Chaudhary"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#0F172A" }}>Email Address</Text>
                  <Text style={{ fontFamily: "Outfit-Medium", fontSize: 11, color: "#71717B", backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>Optional</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 12, height: 50 }}>
                  <Text style={{ fontSize: 16, color: "#8b5cf6" }}>✉️</Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: "Outfit-Regular", fontSize: 14, color: "#0F172A", height: "100%" }}
                    placeholder="e.g. hello@spinzo.in"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Date of Birth */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#0F172A" }}>Date of Birth</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 12, height: 50 }}>
                  <TextInput
                    style={{ flex: 1, fontFamily: "Outfit-Regular", fontSize: 14, color: "#0F172A", height: "100%" }}
                    placeholder="DD / MM / YYYY"
                    placeholderTextColor="#94A3B8"
                    value={dob}
                    onChangeText={setDob}
                  />
                  <Text style={{ fontSize: 16, color: "#8b5cf6" }}>📅</Text>
                </View>
              </View>

              {/* Gender */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#0F172A" }}>Gender</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {genders.map((g) => {
                    const isSelected = gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setGender(g)}
                        style={{
                          borderRadius: 999,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          backgroundColor: isSelected ? "#8e51ff" : "#fff",
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: "#E2E8F0",
                          shadowColor: isSelected ? "#8e51ff" : "transparent",
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: isSelected ? 0.25 : 0,
                          shadowRadius: 20,
                          elevation: isSelected ? 4 : 0,
                        }}
                      >
                        <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: isSelected ? "#fff" : "#0F172A" }}>{g}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Referral Code */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#0F172A" }}>Referral Code</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 12, height: 50 }}>
                  <Text style={{ fontSize: 16, color: "#8b5cf6" }}>🏷️</Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: "Outfit-Regular", fontSize: 14, color: "#0F172A", height: "100%" }}
                    placeholder="Enter code (optional)"
                    placeholderTextColor="#94A3B8"
                    value={referral}
                    onChangeText={setReferral}
                  />
                  <TouchableOpacity>
                    <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#7C3AED" }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Credits offer card */}
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", padding: 16, shadowColor: "rgba(124,58,237,0.08)", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 30, elevation: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#F5F0FF", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20, color: "#7C3AED" }}>👛</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#0F172A" }}>Get ₹50 credits on signup!</Text>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 13, color: "#71717B" }}>Automatically added to your wallet</Text>
              </View>
              <View style={{ backgroundColor: "#F0FDF4", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 11, color: "#16A34A" }}>FREE</Text>
              </View>
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={!isValid}
            style={{
              borderRadius: 14,
              opacity: isValid ? 1 : 0.5,
              shadowColor: "#8e51ff",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: isValid ? 0.28 : 0,
              shadowRadius: 30,
              elevation: isValid ? 8 : 0,
            }}
          >
            <LinearGradient
              colors={["#8e51ff", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              <Text style={{ fontSize: 20, color: "#f5f0ff" }}>✓</Text>
              <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 16, color: "#f5f0ff" }}>Create Account & Continue</Text>
              <Text style={{ fontSize: 16, color: "#f5f0ff" }}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
