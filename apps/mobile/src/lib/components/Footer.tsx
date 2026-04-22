import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type TabType = "availability" | "hobbies" | "requests" | "profile";

type Props = {
  tab: TabType;
  setTab: (tab: TabType) => void;
};

export default function Footer({ tab, setTab }: Props) {
  return (
    <View style={styles.footer}>
      <TabButton
        label="Availability"
        active={tab === "availability"}
        onPress={() => setTab("availability")}
      />
      <TabButton
        label="Hobbies"
        active={tab === "hobbies"}
        onPress={() => setTab("hobbies")}
      />
      <TabButton
        label="Requests"
        active={tab === "requests"}
        onPress={() => setTab("requests")}
      />
      <TabButton
        label="Profile"
        active={tab === "profile"}
        onPress={() => setTab("profile")}
      />
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.activeButton,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.text, active && styles.activeText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#000",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  activeButton: {
    backgroundColor: "#fff",
  },
  text: {
    color: "#fff",
    fontWeight: "700",
  },
  activeText: {
    color: "#000",
  },
});