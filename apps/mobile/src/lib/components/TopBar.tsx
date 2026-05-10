import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { useFonts } from "expo-font";

const logo = require("../../../assets/logo.png");

export default function TopBar({
  title,
  onLogout,
}: {
  title: string;
  onLogout: () => void;
}) {
  const [fontsLoaded] = useFonts({
    Geshina: require("../../assets/fonts/GeshinaShadow-z8BpL.otf"),
  });

  if (!fontsLoaded) {
    return null;
  }
  return (
    <View style={styles.topBar}>
      <View style={styles.logoWrap}>
  <Image
    source={logo}
    resizeMode="contain"
    style={styles.logoImage}
  />

  <Text style={styles.logo}>{title}</Text>
</View>

      <Pressable onPress={onLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>LOGOUT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    width: "100%",
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    color: "white",
    fontSize: 32,
    fontFamily: "Geshina",
    letterSpacing: 1,
  },

  logoutBtn: {
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  logoWrap: {
  flexDirection: "row",
  alignItems: "center",
},

logoImage: {
  width: 42,
  height: 42,
  marginRight: 10,
},

  logoutText: {
    color: "#000000",
    fontWeight: "700",
  },
});