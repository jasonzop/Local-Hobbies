import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function TopBar({
  title,
  onLogout,
}: {
  title: string;
  onLogout: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.logo}>{title}</Text>

      <Pressable onPress={onLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    width: "100%",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  logoutBtn: {
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});