import { Platform } from "react-native";

export const colors = {
  canvas: "#F5F3EC",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF3EE",
  ink: "#17231B",
  muted: "#68756C",
  subtle: "#8A958D",
  border: "#DCE4DD",
  brand: "#2E7248",
  brandDark: "#18442B",
  brandSoft: "#DDF2E4",
  accent: "#F3B847",
  accentSoft: "#FFF3D8",
  danger: "#BE4C4C",
  dangerSoft: "#FBE8E7",
  info: "#386D9A",
  infoSoft: "#E5F0F8",
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
    boxShadow: "0 12px 32px rgba(23, 35, 27, 0.08)",
  },
  default: {
    shadowColor: "#17231B",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});

export function initials(name?: string) {
  const parts = (name || "Local Hobbies").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "LH";
}
