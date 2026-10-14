import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import Footer from "./src/lib/components/Footer";
import { clearSession, getSavedUserId, getUserById, updateUserLocation, User } from "./src/lib/api";
import AvailabilityScreen from "./src/lib/screens/AvailabilityScreen";
import ChatScreen from "./src/lib/screens/ChatScreen";
import CreateProfileScreen from "./src/lib/screens/CreateProfileScreen";
import FriendRequestsScreen from "./src/lib/screens/FriendRequestsScreen";
import GuestExperienceScreen from "./src/lib/screens/GuestExperienceScreen";
import HobbiesScreen from "./src/lib/screens/HobbiesScreen";
import LoginScreen from "./src/lib/screens/LoginScreen";
import ProfileScreen from "./src/lib/screens/ProfileScreen";
import RequestsScreen from "./src/lib/screens/RequestsScreen";
import UserSearchScreen from "./src/lib/screens/UserSearchScreen";
import { colors, initials, radius } from "./src/lib/theme";

const logo = require("./assets/logo.png");

const guestUser: User = {
  id: -1,
  name: "Guest preview",
  email: "guest@localhobbies.demo",
  bio: "A read-only tour of Local Hobbies.",
  hobbies: ["Hiking", "Photography", "Coffee"],
};

export type MainTab = "availability" | "hobbies" | "requests" | "profile";

export default function App() {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [tab, setTab] = useState<MainTab>("availability");
  const [chatUser, setChatUser] = useState<{ id: number; name: string } | null>(null);
  const [viewingProfileUserId, setViewingProfileUserId] = useState<number | null>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  async function refreshUserFromBackend() {
    const userId = await getSavedUserId();

    if (!userId) {
      setUser(null);
      return;
    }

    try {
      setUser(await getUserById(userId));
    } catch (error) {
      console.error("Could not restore the saved session:", error);
      await clearSession();
      setUser(null);
    }
  }

  useEffect(() => {
    refreshUserFromBackend().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const currentUserId = user.id;

    async function syncLocation() {
      try {
        let shouldContinue = true;

        if (Platform.OS === "web") {
          shouldContinue = window.confirm(
            "Share your location to see hobby partners nearby? You can still use the rest of the app if you choose not to."
          );
        } else {
          shouldContinue = await new Promise<boolean>((resolve) => {
            Alert.alert(
              "Find people nearby?",
              "Your approximate location helps Local Hobbies find nearby activity partners.",
              [
                { text: "Not now", style: "cancel", onPress: () => resolve(false) },
                { text: "Continue", onPress: () => resolve(true) },
              ]
            );
          });
        }

        if (!shouldContinue) return;

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const updated = await updateUserLocation(
          currentUserId,
          location.coords.latitude,
          location.coords.longitude
        );
        setUser(updated);
      } catch (error) {
        console.warn("Location could not be updated:", error);
      }
    }

    syncLocation();
  }, [user?.id]);

  async function handleLoginSuccess(isNewUser = false) {
    await refreshUserFromBackend();
    setNeedsProfileSetup(isNewUser);
  }

  async function handleLogout() {
    await clearSession();
    setGuestMode(false);
    setUser(null);
    setChatUser(null);
    setViewingProfileUserId(null);
    setShowSearch(false);
    setShowFriendRequests(false);
    setNeedsProfileSetup(false);
    setTab("availability");
  }

  function navigate(nextTab: MainTab) {
    setChatUser(null);
    setViewingProfileUserId(null);
    setShowSearch(false);
    setShowFriendRequests(false);
    setTab(nextTab);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <Image source={logo} resizeMode="contain" style={styles.loadingLogo} />
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={styles.loadingText}>Getting your plans ready…</Text>
      </SafeAreaView>
    );
  }

  if (!user && !guestMode) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onGuestPress={() => {
            setGuestMode(true);
            setTab("availability");
          }}
        />
      </>
    );
  }

  if (needsProfileSetup && user) {
    return (
      <CreateProfileScreen
        user={user}
        onDone={(updatedUser: User) => {
          setUser(updatedUser);
          setNeedsProfileSetup(false);
        }}
      />
    );
  }

  const activeUser = guestMode ? guestUser : user;

  if (!activeUser) return null;

  const pageTitle = guestMode
    ? tab === "availability"
      ? "Preview the week"
      : tab === "hobbies"
        ? "Preview discovery"
        : tab === "requests"
          ? "Preview meetups"
          : "Preview profile"
    : chatUser
    ? `Chat with ${chatUser.name}`
    : showSearch
      ? "Find people"
      : showFriendRequests
        ? "Friend requests"
        : tab === "availability"
          ? "Plan your week"
          : tab === "hobbies"
            ? "Discover"
            : tab === "requests"
              ? "Meetups"
              : "Your profile";

  return (
    <LinearGradient
      colors={["#010302", "#07140B", "#0B2A17"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.appGradient}
    >
      <SafeAreaView style={styles.app}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image source={logo} resizeMode="contain" style={styles.logo} />
          {!compact && (
            <View>
              <Text style={styles.brandName}>LOCAL HOBBIES</Text>
              <Text style={styles.brandTagline}>Good company starts nearby.</Text>
            </View>
          )}
        </View>

        <Text style={[styles.pageTitle, compact && styles.pageTitleCompact]} numberOfLines={1}>
          {pageTitle}
        </Text>

        <View style={styles.topActions}>
          {!guestMode && (
            <>
              <IconButton
                icon="search-outline"
                label="Search"
                onPress={() => {
                  setChatUser(null);
                  setShowFriendRequests(false);
                  setShowSearch(true);
                }}
              />
              <IconButton
                icon="notifications-outline"
                label="Friend requests"
                onPress={() => {
                  setChatUser(null);
                  setShowSearch(false);
                  setShowFriendRequests(true);
                }}
              />
            </>
          )}
          {!compact ? (
            <Pressable onPress={() => navigate("profile")} style={styles.userChip}>
              <View style={styles.avatarSmall}>
                {activeUser.profileImageUrl ? (
                  <Image source={{ uri: activeUser.profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{guestMode ? "G" : initials(activeUser.name)}</Text>
                )}
              </View>
              <Text style={styles.userName} numberOfLines={1}>{activeUser.name}</Text>
            </Pressable>
          ) : (
            <IconButton icon="person-outline" label="Profile" onPress={() => navigate("profile")} />
          )}
        </View>
        </View>

        <View style={styles.contentShell}>
          <View style={styles.content}>
          {guestMode ? (
            <GuestExperienceScreen tab={tab} onExit={handleLogout} />
          ) : chatUser ? (
            <ChatScreen
              currentUser={activeUser}
              otherUserId={chatUser.id}
              otherUserName={chatUser.name}
              onBack={() => setChatUser(null)}
            />
          ) : showSearch ? (
            <UserSearchScreen
              currentUser={activeUser}
              onBack={() => setShowSearch(false)}
              onOpenProfile={(userId) => {
                setViewingProfileUserId(userId);
                setShowSearch(false);
                setTab("profile");
              }}
            />
          ) : showFriendRequests ? (
            <FriendRequestsScreen currentUser={activeUser} onBack={() => setShowFriendRequests(false)} />
          ) : tab === "availability" ? (
            <AvailabilityScreen user={activeUser} />
          ) : tab === "hobbies" ? (
            <HobbiesScreen user={activeUser} />
          ) : tab === "requests" ? (
            <RequestsScreen currentUser={activeUser} onOpenChat={setChatUser} />
          ) : (
            <ProfileScreen
              user={activeUser}
              viewingUserId={viewingProfileUserId}
              onBack={viewingProfileUserId ? () => {
                setViewingProfileUserId(null);
                setShowSearch(true);
              } : undefined}
              onLogout={handleLogout}
              onUserUpdated={(updatedUser) => {
                if (!updatedUser.id) return;
                setUser({
                  id: updatedUser.id,
                  name: updatedUser.name || "",
                  email: updatedUser.email || "",
                  bio: updatedUser.bio,
                  profileImageUrl: updatedUser.profileImageUrl,
                  coverImageUrl: updatedUser.coverImageUrl,
                  hobbies: updatedUser.hobbies,
                });
              }}
            />
          )}
          </View>
        </View>

        {(guestMode || (!chatUser && !showSearch && !showFriendRequests)) && (
          <Footer tab={tab} setTab={navigate} />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={21} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  appGradient: { flex: 1 },
  app: { flex: 1, backgroundColor: "transparent" },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: colors.canvas,
  },
  loadingLogo: { width: 90, height: 90, marginBottom: 4 },
  loadingText: { color: colors.muted, fontSize: 15, fontWeight: "600" },
  topBar: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: "rgba(2, 8, 4, 0.94)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandRow: { flexDirection: "row", alignItems: "center", minWidth: 52 },
  logo: { width: 48, height: 48, marginRight: 10 },
  brandName: { color: "#FFFFFF", fontWeight: "900", fontSize: 15, letterSpacing: 1.3 },
  brandTagline: { color: "#BBD0C2", fontSize: 11, marginTop: 2 },
  pageTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 18, textAlign: "center", flex: 1 },
  pageTitleCompact: { fontSize: 15 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  userChip: {
    height: 42,
    maxWidth: 180,
    paddingHorizontal: 6,
    paddingRight: 13,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: "#07140B", fontSize: 11, fontWeight: "900" },
  userName: { color: "#FFFFFF", fontWeight: "700", maxWidth: 110 },
  contentShell: { flex: 1, backgroundColor: "rgba(5,8,6,0.78)" },
  content: { flex: 1, width: "100%", maxWidth: 1180, alignSelf: "center" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
