import { ScrollView, View, Text, TouchableOpacity, Image, useWindowDimensions, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MapPin, ChevronDown, Wallet, Bell, Sparkles, ShoppingBag,
  BadgePercent, CreditCard, CheckCircle2, Truck, ShieldCheck,
  PlayCircle, Play, Star, User, HelpCircle,
} from "lucide-react-native";

const services = [
  { id: "1", title: "Wash & Fold", desc: "Everyday laundry care", badge: "2 hrs", img: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=80" },
  { id: "2", title: "Wash & Iron", desc: "Clean, crisp, ready to wear", badge: "Same day", img: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&q=80" },
  { id: "3", title: "Steam Iron", desc: "Sharp finish, no wrinkles", badge: "Express", img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80" },
  { id: "4", title: "Blanket Wash", desc: "Bulky items, handled well", badge: "Deep clean", img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80" },
];

const reviews = [
  { name: "Aarav Mehta", time: "2 days ago", text: "Super smooth pickup and the clothes came back perfectly folded. The app feels premium and easy to use." },
  { name: "Priya Sharma", time: "1 week ago", text: "Reliable timing, great packaging, and the subscription makes it feel effortless every week." },
  { name: "Karan Patel", time: "3 days ago", text: "The quality is consistent and the pickup-drop flow is genuinely convenient for a busy household." },
];

const faqs = ["How fast is pickup?", "What areas do you serve?", "How does subscription pricing work?"];
const metrics = [
  { value: "12k+", label: "Families served" },
  { value: "24h", label: "Average turnaround" },
  { value: "Eco", label: "Certified detergents" },
  { value: "Free", label: "Pickup & drop" },
];

function Stars() {
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11} color="#8e51ff" fill="#8e51ff" />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const isLarge = Platform.OS === "web" && W >= 768;
  const pad = Math.min(24, W * 0.06);
  const maxContentW = Math.min(W - pad * 2, 500);
  const halfGap = 6;
  const cardW = (maxContentW - halfGap) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F7FC" }}>
      {/* Web desktop background */}
      {Platform.OS === "web" && W > 600 && (
        <View style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <View style={{ position: "absolute", top: "5%", left: "3%", width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(142,81,255,0.05)" }} />
          <View style={{ position: "absolute", bottom: "10%", right: "5%", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(142,81,255,0.04)" }} />
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 500, paddingHorizontal: pad, paddingTop: Math.max(insets.top + 8, 16), gap: 20, paddingBottom: 32 }}>
          {/* ===== HEADER ===== */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity activeOpacity={0.7} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 999, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 12, paddingVertical: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(142,81,255,0.1)", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={16} color="#8e51ff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontFamily: "Outfit-Medium", fontSize: 10, color: "#64748B", letterSpacing: 2, textTransform: "uppercase" }}>Deliver to</Text>
                  <ChevronDown size={10} color="#64748B" />
                </View>
                <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 13, color: "#0F172A" }} numberOfLines={1}>Home • 24, Lake View Residency</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 999, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 12, paddingVertical: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={16} color="#8e51ff" />
              </View>
              <View>
                <Text style={{ fontFamily: "Outfit-Medium", fontSize: 10, color: "#64748B", letterSpacing: 1.5, textTransform: "uppercase" }}>Credits</Text>
                <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#0F172A" }}>0</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
              <Bell size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* ===== HERO ===== */}
          <LinearGradient colors={["#F5F0FF", "#EDE4FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, borderWidth: 1, borderColor: "#E2E8F0", padding: 24, shadowColor: "#8e51ff", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 4 }}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1, gap: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start" }}>
                  <Sparkles size={14} color="#8e51ff" />
                  <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 11, color: "#8e51ff", letterSpacing: 2, textTransform: "uppercase" }}>Premium laundry</Text>
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontFamily: "Outfit-Bold", fontSize: isLarge ? 24 : 22, color: "#0F172A", letterSpacing: -0.5 }}>Good Afternoon, Nischay</Text>
                  <Text style={{ fontFamily: "Outfit-Regular", fontSize: 13, color: "#64748B", lineHeight: 20, maxWidth: 220 }}>Fresh pickup, fast turnaround, and effortless care.</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity activeOpacity={0.85} style={{ backgroundColor: "#8e51ff", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 13, color: "#f5f0ff" }}>Book pickup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.85} style={{ backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: "#E2E8F0" }}>
                    <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 13, color: "#0F172A" }}>View offers</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" }}>
                <ShoppingBag size={32} color="#8e51ff" />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ width: i === 0 ? 28 : 8, height: 8, borderRadius: 4, backgroundColor: i === 0 ? "#8e51ff" : "rgba(142,81,255,0.25)" }} />
              ))}
            </View>
          </LinearGradient>

          {/* ===== SERVICES ===== */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {services.slice(0, 2).map((s) => (
                <TouchableOpacity key={s.id} activeOpacity={0.9} style={{ width: cardW, borderRadius: 24, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" }}>
                  <View style={{ height: cardW * 0.85, position: "relative" }}>
                    <Image source={{ uri: s.img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.2)" }} />
                    <View style={{ position: "absolute", left: 10, bottom: 10, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 11, color: "#0F172A" }}>{s.badge}</Text>
                    </View>
                  </View>
                  <View style={{ padding: 14, gap: 2 }}>
                    <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#0F172A" }}>{s.title}</Text>
                    <Text style={{ fontFamily: "Outfit-Regular", fontSize: 12, color: "#64748B" }}>{s.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {services.slice(2).map((s) => (
                <TouchableOpacity key={s.id} activeOpacity={0.9} style={{ width: cardW, borderRadius: 24, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" }}>
                  <View style={{ height: cardW * 0.85, position: "relative" }}>
                    <Image source={{ uri: s.img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.2)" }} />
                    <View style={{ position: "absolute", left: 10, bottom: 10, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 11, color: "#0F172A" }}>{s.badge}</Text>
                    </View>
                  </View>
                  <View style={{ padding: 14, gap: 2 }}>
                    <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#0F172A" }}>{s.title}</Text>
                    <Text style={{ fontFamily: "Outfit-Regular", fontSize: 12, color: "#64748B" }}>{s.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ===== SUBSCRIPTION ===== */}
          <LinearGradient colors={["#F5F0FF", "#EDE4FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, borderWidth: 1, borderColor: "#E2E8F0", padding: 24, shadowColor: "#8e51ff", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
              <View style={{ flex: 1, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#8e51ff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
                  <BadgePercent size={12} color="#f5f0ff" />
                  <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 11, color: "#f5f0ff" }}>Smart Care Subscription</Text>
                </View>
                <Text style={{ fontFamily: "Outfit-Bold", fontSize: 18, color: "#0F172A", letterSpacing: -0.3 }}>Save 20% on every order</Text>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 13, color: "#64748B", lineHeight: 20 }}>Priority pickup, lower prices, and a smoother routine.</Text>
              </View>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={22} color="#8e51ff" />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              {[
                { icon: CheckCircle2, text: "Free pickup scheduling" },
                { icon: Truck, text: "Pickup & drop included" },
              ].map(({ icon: Icon, text }, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon size={16} color="#8e51ff" />
                    <Text style={{ fontFamily: "Outfit-Medium", fontSize: 13, color: "#0F172A" }}>{text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* ===== TRUST ===== */}
          <View style={{ borderRadius: 28, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", padding: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontFamily: "Outfit-Bold", fontSize: 16, color: "#0F172A", letterSpacing: -0.3 }}>Why families trust us</Text>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 13, color: "#64748B", lineHeight: 20 }}>Built for busy homes with reliable turnaround.</Text>
              </View>
              <View style={{ backgroundColor: "rgba(142,81,255,0.1)", borderRadius: 16, padding: 10 }}>
                <ShieldCheck size={20} color="#8e51ff" />
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
              {metrics.map((m, i) => (
                <View key={i} style={{ width: "50%", padding: 6 }}>
                  <View style={{ backgroundColor: "#F8F7FC", borderRadius: 16, padding: 16 }}>
                    <Text style={{ fontFamily: "Outfit-Bold", fontSize: 24, color: "#0F172A", letterSpacing: -0.5 }}>{m.value}</Text>
                    <Text style={{ fontFamily: "Outfit-Regular", fontSize: 12, color: "#64748B", marginTop: 4 }}>{m.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ===== HOW IT WORKS ===== */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontFamily: "Outfit-Bold", fontSize: 16, color: "#0F172A", letterSpacing: -0.3 }}>How it works</Text>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 13, color: "#64748B" }}>Three simple steps to fresh laundry</Text>
              </View>
              <PlayCircle size={22} color="#8e51ff" />
            </View>
            <TouchableOpacity activeOpacity={0.9} style={{ borderRadius: 24, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", overflow: "hidden" }}>
              <View style={{ aspectRatio: 16 / 9, position: "relative" }}>
                <Image source={{ uri: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=80" }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
                <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}>
                    <Play size={24} color="#8e51ff" />
                  </View>
                </View>
                <View style={{ position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontFamily: "Outfit-Medium", fontSize: 13, color: "#0F172A" }}>Watch the pickup flow</Text>
                  <Text style={{ fontFamily: "Outfit-Regular", fontSize: 12, color: "#64748B" }}>0:42</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ===== REVIEWS ===== */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontFamily: "Outfit-Bold", fontSize: 16, color: "#0F172A", letterSpacing: -0.3 }}>Reviews</Text>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 13, color: "#64748B" }}>Loved by busy households</Text>
              </View>
              <Star size={20} color="#8e51ff" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} decelerationRate="fast" snapToInterval={302}>
              {reviews.map((r, i) => (
                <View key={i} style={{ width: 290, borderRadius: 24, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", padding: 18 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(142,81,255,0.1)", alignItems: "center", justifyContent: "center" }}>
                        <User size={18} color="#8e51ff" />
                      </View>
                      <View>
                        <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#0F172A" }}>{r.name}</Text>
                        <Text style={{ fontFamily: "Outfit-Regular", fontSize: 12, color: "#64748B" }}>{r.time}</Text>
                      </View>
                    </View>
                    <Stars />
                  </View>
                  <Text style={{ fontFamily: "Outfit-Regular", fontSize: 13, color: "#64748B", lineHeight: 20, marginTop: 12 }}>{r.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ===== FAQ ===== */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontFamily: "Outfit-Bold", fontSize: 16, color: "#0F172A", letterSpacing: -0.3 }}>FAQ</Text>
                <Text style={{ fontFamily: "Outfit-Regular", fontSize: 13, color: "#64748B" }}>Quick answers before you book</Text>
              </View>
              <HelpCircle size={20} color="#8e51ff" />
            </View>
            <View style={{ gap: 8 }}>
              {faqs.map((q, i) => (
                <TouchableOpacity key={i} activeOpacity={0.7} style={{ borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontFamily: "Outfit-Medium", fontSize: 14, color: "#0F172A", flex: 1 }}>{q}</Text>
                  <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
