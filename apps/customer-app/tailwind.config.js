/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#8e51ff",
        "primary-light": "#a87aff",
        "primary-dark": "#6b3bcc",
        "primary-bg": "oklch(0.985 0.01 292.717)",
        surface: "#FFFFFF",
        "surface-secondary": "#F4F4F5",
        "text-primary": "#18181B",
        "text-muted": "#71717B",
        border: "#E4E4E7",
      },
      fontFamily: {
        outfit: ["Outfit-Regular"],
        "outfit-medium": ["Outfit-Medium"],
        "outfit-semibold": ["Outfit-SemiBold"],
        "outfit-bold": ["Outfit-Bold"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "28px",
      },
    },
  },
  plugins: [],
};
