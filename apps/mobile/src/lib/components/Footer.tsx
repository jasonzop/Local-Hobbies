import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MainTab } from "../../../App";
import { colors, radius } from "../theme";

const tabs: Array<{
  key: MainTab;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  activeIcon: React.ComponentProps<typeof Ionicons>["name"];
}> = [
  { key: "availability", label: "Schedule", icon: "calendar-outline", activeIcon: "calendar" },
  { key: "hobbies", label: "Discover", icon: "compass-outline", activeIcon: "compass" },
  { key: "requests", label: "Meetups", icon: "people-outline", activeIcon: "people" },
  { key: "profile", label: "Profile", icon: "person-circle-outline", activeIcon: "person-circle" },
];

export default function Footer({
  tab,
  setTab,
}: {
  tab: MainTab;
  setTab: (tab: MainTab) => void;
}) {
  return (
    <View style={styles.footer}>
      <View style={styles.inner}>
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.key)}
              style={({ pressed }) => [
                styles.button,
                active && styles.activeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={22}
                color={active ? colors.brand : colors.muted}
              />
              <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inner: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    minWidth: 70,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: "center",
    gap: 3,
  },
  activeButton: { backgroundColor: colors.brandSoft },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  activeLabel: { color: colors.brandDark },
  pressed: { opacity: 0.65 },
});
