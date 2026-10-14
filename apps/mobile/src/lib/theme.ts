import { Platform } from "react-native";

export const colors = {
  canvas: "#050806",
  surface: "#0C1510",
  surfaceMuted: "#121F17",
  ink: "#F2F8F4",
  muted: "#9BAAA0",
  subtle: "#718078",
  border: "#243A2B",
  brand: "#238C50",
  brandDark: "#79E6A3",
  brandSoft: "#123722",
  accent: "#B8E96F",
  accentSoft: "#27351D",
  danger: "#FF7A7A",
  dangerSoft: "#35191B",
  info: "#69B7F0",
  infoSoft: "#12293B",
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
};

export const shadow = Platform.select({
  web: {
    boxShadow: "0 18px 46px rgba(0, 0, 0, 0.34)",
  },
  default: {
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});

export function initials(name?: string) {
  const parts = (name || "Local Hobbies").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "LH";
}
