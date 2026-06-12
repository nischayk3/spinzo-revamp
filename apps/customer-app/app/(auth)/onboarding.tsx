import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

type Slide = {
  id: string;
  heading: string;
  subtitle: string;
  image?: string;
  isAbstract?: "purple" | "colorful";
  isLast?: boolean;
};

const slides: Slide[] = [
  {
    id: "1",
    heading: "Your Weekend is to Live",
    subtitle: "Let us handle your laundry while you enjoy your free time.",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80",
  },
  {
    id: "2",
    heading: "Fast, Affordable, Hygienic",
    subtitle: "Quick service at your doorstep with premium quality.",
    isAbstract: "purple",
  },
  {
    id: "3",
    heading: "Eco-Friendly Service",
    subtitle: "Sustainable cleaning that cares for your clothes and planet.",
    isAbstract: "colorful",
    isLast: true,
  },
];

// ─── Shared sizes ────────────────────────────────────────────────

const HEADER_H = 54;
const BOTTOM_MIN = 120;
const H_PADDING = 32;

// ─── Components ──────────────────────────────────────────────────

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 36 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === active ? "#8e51ff" : "#E2E8F0",
          }}
        />
      ))}
    </View>
  );
}

function ImageSlide() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: H_PADDING }}>
      <View
        style={{
          width: "100%",
          maxWidth: 300,
          flex: 1,
          maxHeight: 360,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          backgroundColor: "rgba(142,81,255,0.05)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <View style={{ position: "absolute", left: 20, top: 24, width: 14, height: 14, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.85)" }} />
        <View style={{ position: "absolute", right: 24, top: 48, width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(142,81,255,0.5)" }} />
        <View style={{ position: "absolute", left: 32, bottom: 40, width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(142,81,255,0.25)" }} />
        <View style={{ position: "absolute", right: 36, bottom: 60, width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.6)" }} />

        <View
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "72%",
            aspectRatio: 0.8,
            borderRadius: 24,
            overflow: "hidden",
            transform: [{ translateX: "-36%" as any }, { translateY: "-48%" }],
          }}
        >
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80" }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
}

function PurpleAbstract() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: H_PADDING }}>
      <View
        style={{
          width: "100%",
          maxWidth: 300,
          flex: 1,
          maxHeight: 360,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          backgroundColor: "#fff",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <View style={{ position: "absolute", left: 24, top: 28, width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(142,81,255,0.5)" }} />
        <View style={{ position: "absolute", right: 28, top: 60, width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(142,81,255,0.35)" }} />
        <View style={{ position: "absolute", left: 28, bottom: 60, width: 14, height: 14, borderRadius: 7, backgroundColor: "rgba(142,81,255,0.25)" }} />
        <View style={{ position: "absolute", right: 36, bottom: 44, width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(142,81,255,0.4)" }} />

        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "rgba(255,255,255,0.92)",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(142,81,255,0.06)",
          }}
        >
          <LinearGradient
            colors={["rgba(142,81,255,0.95)", "rgba(142,81,255,0.65)"]}
            style={{ width: 104, height: 104, borderRadius: 52, justifyContent: "center", alignItems: "center" }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 6, borderColor: "rgba(255,255,255,0.85)" }} />
          </LinearGradient>
        </View>

        <View style={{ position: "absolute", bottom: -20, width: 60, height: 60, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.9)", borderWidth: 1, borderColor: "rgba(255,255,255,0.8)" }} />
      </View>
    </View>
  );
}

function ColorfulAbstract() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: H_PADDING }}>
      <View
        style={{
          width: "100%",
          maxWidth: 300,
          flex: 1,
          maxHeight: 360,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          backgroundColor: "rgba(142,81,255,0.04)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <View style={{ position: "absolute", left: 16, top: 28, width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(142,81,255,0.16)" }} />
        <View style={{ position: "absolute", right: 20, top: 44, width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(142,81,255,0.3)" }} />
        <View style={{ position: "absolute", left: 28, bottom: 44, width: 14, height: 14, borderRadius: 7, backgroundColor: "rgba(142,81,255,0.18)" }} />
        <View style={{ position: "absolute", right: 32, bottom: 60, width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(142,81,255,0.22)" }} />

        <View style={{ position: "absolute", left: 16, right: 16, top: 24, bottom: 24, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.98)", overflow: "hidden" }}>
          <View style={{ position: "absolute", left: 18, top: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(34,197,94,0.88)" }} />
          <View style={{ position: "absolute", right: 22, top: 32, width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(74,222,128,0.88)" }} />
          <View style={{ position: "absolute", left: 32, bottom: 36, width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(142,81,255,0.88)" }} />
          <View style={{ position: "absolute", right: 36, bottom: 32, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.98)" }} />
          <View style={{ position: "absolute", left: 24, right: 24, bottom: 24, height: 60, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.95)" }} />

          <View style={{ position: "absolute", left: "50%", top: "50%", width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(255,255,255,0.98)", justifyContent: "center", alignItems: "center", transform: [{ translateX: -38 }, { translateY: -38 }] }}>
            <LinearGradient colors={["rgba(142,81,255,0.95)", "rgba(142,81,255,0.72)"]} style={{ width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.98)" }} />
            </LinearGradient>
          </View>

          <View style={{ position: "absolute", left: "50%", top: "60%", width: 60, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.95)", transform: [{ translateX: -30 }] }} />
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────

export default function OnboardingScreen() {
  const listRef = useRef<FlatList>(null);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const { width: W, height: H } = useWindowDimensions();

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setActive(Math.round(e.nativeEvent.contentOffset.x / W));
    },
    [W]
  );

  const goNext = useCallback(() => {
    if (active < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: active + 1, animated: true });
    } else {
      // "Get Started" → home screen, not login. Login is only triggered
      // when the user tries a protected action (add to cart, orders, etc.)
      router.replace("/(tabs)/");
    }
  }, [active, router]);

  const goBack = useCallback(() => {
    if (active > 0) listRef.current?.scrollToIndex({ index: active - 1, animated: true });
  }, [active]);

  const skip = useCallback(() => router.replace("/(tabs)/"), [router]);

  // Calculate proportions based on screen height
  const isShortScreen = H < 700;
  const visualMaxH = isShortScreen ? 260 : 360;
  const topPad = isShortScreen ? 40 : 56;
  const botPad = isShortScreen ? 24 : 32;
  const titleSize = isShortScreen ? 24 : 28;
  const maxContentW = Platform.OS === "web" ? Math.min(W, 480) : W;

  const renderSlide = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={{ width: W, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: maxContentW,
            height: H,
            paddingTop: topPad,
            paddingBottom: botPad,
          }}
        >
          {/* Header - fixed height */}
          <View style={{ height: HEADER_H, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PADDING }}>
            <TouchableOpacity onPress={goBack} style={{ width: 52 }}>
              {active > 0 && (
                <Text style={{ fontFamily: "Outfit-Medium", fontSize: 15, color: "#64748B" }}>← Back</Text>
              )}
            </TouchableOpacity>
            <View
              style={{
                backgroundColor: "#8e51ff",
                borderRadius: 999,
                paddingHorizontal: 20,
                paddingVertical: 10,
                shadowColor: "#8e51ff",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              <Text style={{ fontFamily: "Outfit-Black", fontSize: 24, color: "#f5f0ff", letterSpacing: -0.5, lineHeight: 24 }}>
                SpinZo
              </Text>
            </View>
            <TouchableOpacity onPress={skip} style={{ width: 52, alignItems: "flex-end" }}>
              <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 15, color: "#8e51ff" }}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Visual - fills remaining space naturally */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 4 }}>
            <View style={{ width: "100%", flex: 1, maxHeight: visualMaxH, alignItems: "center", justifyContent: "center" }}>
              {item.image ? <ImageSlide /> : item.isAbstract === "purple" ? <PurpleAbstract /> : <ColorfulAbstract />}
            </View>
          </View>

          {/* Text - fixed, always visible */}
          <View style={{ paddingHorizontal: H_PADDING, paddingBottom: 8, gap: 8 }}>
            <Text
              style={{
                fontFamily: "Outfit-Black",
                fontSize: titleSize,
                color: "#0F172A",
                textAlign: "center",
                lineHeight: titleSize + 4,
                letterSpacing: -0.7,
              }}
            >
              {item.heading}
            </Text>
            <Text
              style={{
                fontFamily: "Outfit-Regular",
                fontSize: 15,
                color: "#64748B",
                textAlign: "center",
                lineHeight: 22,
                maxWidth: 280,
                alignSelf: "center",
              }}
            >
              {item.subtitle}
            </Text>
          </View>

          {/* Bottom controls - fixed */}
          <View style={{ minHeight: BOTTOM_MIN, justifyContent: "center", alignItems: "center", paddingHorizontal: H_PADDING, gap: 16 }}>
            <Dots count={slides.length} active={active} />

            {item.isLast ? (
              <View style={{ width: "100%", gap: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={goNext}
                  style={{
                    borderRadius: 16,
                    shadowColor: "#8e51ff",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.28,
                    shadowRadius: 28,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={["#8e51ff", "#a56eff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                  >
                    <Text style={{ fontFamily: "Outfit-Bold", fontSize: 17, color: "#f5f0ff" }}>Get Started</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={skip} style={{ alignItems: "center", paddingVertical: 4 }}>
                  <Text style={{ fontFamily: "Outfit-SemiBold", fontSize: 14, color: "#8e51ff", textDecorationLine: "underline" }}>
                    Browse as Guest
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: "100%", alignItems: "flex-end" }}>
                <TouchableOpacity
                  onPress={goNext}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#8e51ff",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#8e51ff",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 6,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 20, fontFamily: "Outfit-Bold" }}>→</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    ),
    [W, H, maxContentW, active, goNext, goBack, skip, isShortScreen, visualMaxH, topPad, botPad, titleSize]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {Platform.OS === "web" && W > 600 && (
        <View style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <View style={{ position: "absolute", top: "12%", left: "8%", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(142,81,255,0.05)" }} />
          <View style={{ position: "absolute", bottom: "18%", right: "6%", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(142,81,255,0.04)" }} />
        </View>
      )}
      <FlatList
        ref={listRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
      />
    </View>
  );
}
