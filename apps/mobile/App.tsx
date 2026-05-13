import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";

const logo = require("./assets/logo.png");

import {
  clearSession,
  getIncomingRequests,
  getOutgoingRequests,
  getSavedUserId,
  getUserById,
  updateMatchRequestStatus,
  updateUserLocation,
  User,
} from "./src/lib/api";


import CreateProfileScreen from "./src/lib/screens/CreateProfileScreen";
import AvailabilityScreen from "./src/lib/screens/AvailabilityScreen";
import LoginScreen from "./src/lib/screens/LoginScreen";
import HobbiesScreen from "./src/lib/screens/HobbiesScreen";
import FriendRequestsScreen from "./src/lib/screens/FriendRequestsScreen";
import Footer from "./src/lib/components/Footer";
import ChatScreen from "./src/lib/screens/ChatScreen";
import RequestsScreen from "./src/lib/screens/RequestsScreen";
import ProfileScreen from "./src/lib/screens/ProfileScreen";
import UserSearchScreen from "./src/lib/screens/UserSearchScreen";

type AppUser = User;

export default function App() {
  const [loading, setLoading] = useState(true);
const [locationReady, setLocationReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [chatUser, setChatUser] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [viewingProfileUserId, setViewingProfileUserId] = useState<number | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [tab, setTab] = useState<
    "availability" | "hobbies" | "requests" | "profile" | "search" | "friendRequests"
  >("availability");
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  async function refreshUserFromBackend() {
    try {
      const userId = await getSavedUserId();

      if (!userId) {
        setUser(null);
        setLoggedIn(false);
        return;
      }

      const freshUser = await getUserById(userId);

      setUser(freshUser);
      setLoggedIn(true);
    } catch (error) {
      console.error("Refresh user error:", error);
      await clearSession();
      setUser(null);
      setLoggedIn(false);
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        await refreshUserFromBackend();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

useEffect(() => {
  if (!user?.id) return;

  async function askAndSyncLocation() {
    try {
      setLocationReady(false);

      let shouldContinue = false;

      if (Platform.OS === "web") {
        shouldContinue = window.confirm(
          "Allow Local Hobbies to access your location to find nearby users?"
        );
      } else {
        shouldContinue = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Location Access",
            "Allow Local Hobbies to access your location to find nearby users?",
            [
              {
                text: "No",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Yes",
                onPress: () => resolve(true),
              },
            ]
          );
        });
      }

      if (!shouldContinue) {
        console.log("USER DECLINED LOCATION PROMPT");
        setLocationReady(true);
        return;
      }

      console.log("SYNC LOCATION STARTED FOR USER:", user!.id);

      const { status } = await Location.requestForegroundPermissionsAsync();

      console.log("LOCATION PERMISSION STATUS:", status);

      if (status !== "granted") {
        console.log("LOCATION PERMISSION NOT GRANTED");
        setLocationReady(true);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log(
        "LOCATION COORDS:",
        location.coords.latitude,
        location.coords.longitude
      );

      const updatedUser = await updateUserLocation(
        user!.id,
        location.coords.latitude,
        location.coords.longitude
      );

      setUser(updatedUser);
      setLocationReady(true);

      console.log("LOCATION SAVED TO BACKEND FOR USER:", updatedUser.id);
    } catch (err) {
      console.log("FULL LOCATION ERROR:", err);
      setLocationReady(true);
    }
  }

  askAndSyncLocation();
}, [user?.id]);

  const handleLoginSuccess = async (isNewUser = false) => {
    await refreshUserFromBackend();
    setNeedsProfileSetup(isNewUser);
  };

  const handleLogout = async () => {
    try {
      await clearSession();

      setUser(null);
      setLoggedIn(false);
      setChatUser(null);
      setNeedsProfileSetup(false);
      setTab("availability");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

const renderTopBar = () => (
  <View
    style={{
      backgroundColor: "#000",
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
  <Image
    source={logo}
    resizeMode="contain"
    style={{
      width: 34,
      height: 34,
      marginRight: 8,
    }}
  />

  <Text
    style={{
      color: "#fff",
      fontWeight: "900",
      fontSize: 20,
      fontFamily: "Geshina",
    }}
  >
    LOCAL HOBBIES
  </Text>
</View>

    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Pressable
        onPress={() => {
          setChatUser(null);
          setTab("search");
        }}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#111",
          borderWidth: 1,
          borderColor: "#444",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="search" size={22} color="#fff" />
      </Pressable>

      <Pressable
        onPress={() => setTab("friendRequests")}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#111",
          borderWidth: 1,
          borderColor: "#444",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="notifications" size={22} color="#fff" />
      </Pressable>

      <Pressable onPress={handleLogout}>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13,fontFamily: "Geshina" }}>
          LOGOUT
        </Text>
      </Pressable>
    </View>
  </View>
);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (needsProfileSetup && user) {
    return (
      <CreateProfileScreen
        user={user}
        onDone={async (updatedUser: any) => {
          setUser(updatedUser);
          setNeedsProfileSetup(false);
        }}
      />
    );
  }

  if (user && chatUser) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {renderTopBar()}
        <View style={{ flex: 1, padding: 16 }}>
          <ChatScreen
            currentUser={user}
            otherUserId={chatUser.id}
            otherUserName={chatUser.name}
            onBack={() => setChatUser(null)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#063a00" }}>
      {renderTopBar()}

      <View style={{ flex: 1, padding: 16 }}>
        {tab === "availability" && <AvailabilityScreen user={user} />}
        {tab === "hobbies" && <HobbiesScreen user={user} />}
        {tab === "requests" && (
          <RequestsScreen currentUser={user} onOpenChat={setChatUser} />
        )}
        {tab === "friendRequests" && (
  <FriendRequestsScreen
  currentUser={user}
  onBack={() => setTab("availability")}
/>
)}
        {tab === "profile" && (
  <ProfileScreen
    user={user}
    viewingUserId={viewingProfileUserId}
    onBack={
      viewingProfileUserId
        ? () => {
            setViewingProfileUserId(null);
            setTab("search");
          }
        : undefined
    }
    onLogout={handleLogout}
    onUserUpdated={async (updatedUser) => {
      setUser(updatedUser as AppUser);
    }}
  />
)}
        {tab === "search" && (
          <UserSearchScreen
  currentUser={user}
  onBack={() => setTab("availability")}
  onOpenProfile={(userId) => {
    setViewingProfileUserId(userId);
    setTab("profile");
  }}
/>
        )}
      </View>

      {tab !== "search" && tab !== "friendRequests" && (
  <Footer tab={tab} setTab={setTab} />
)}
    </SafeAreaView>
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
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        opacity: active ? 1 : 0.6,
      }}
    >
      <Text style={{ fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function RequestsTab({
  currentUser,
  onOpenChat,
}: {
  currentUser: AppUser;
  onOpenChat: (user: { id: number; name: string }) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingProfileUserId, setViewingProfileUserId] = useState<number | null>(null);

  async function load() {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data =
        type === "incoming"
          ? await getIncomingRequests(currentUser.id)
          : await getOutgoingRequests(currentUser.id);

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load requests");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [type]);

  async function update(
    id: string,
    status: "accepted" | "declined" | "cancelled"
  ) {
    await updateMatchRequestStatus(id, status);
    load();
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Requests</Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#111",
          borderRadius: 16,
          padding: 14,
          marginTop: 12,
          flex: 1,
          backgroundColor: "#fff",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Pressable onPress={() => setType("incoming")}>
            <Text
              style={{
                fontWeight: "700",
                color: type === "incoming" ? "#2563eb" : "#111",
              }}
            >
              Incoming
            </Text>
          </Pressable>

          <Pressable onPress={() => setType("outgoing")}>
            <Text
              style={{
                fontWeight: "700",
                color: type === "outgoing" ? "#2563eb" : "#111",
              }}
            >
              Outgoing
            </Text>
          </Pressable>

          <Pressable onPress={load} style={{ marginLeft: "auto" }}>
            <Text style={{ fontWeight: "700" }}>
              {loading ? "Loading..." : "Refresh"}
            </Text>
          </Pressable>
        </View>

        {error && (
          <Text style={{ marginBottom: 10, color: "red" }}>{error}</Text>
        )}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={
            !loading ? (
              <Text style={{ color: "#666" }}>No requests yet.</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const otherId =
              item.senderId === currentUser.id ? item.receiverId : item.senderId;

            const otherName =
              type === "outgoing"
                ? item.receiverName || `User ${item.receiverId}`
                : item.senderName || `User ${item.senderId}`;

            return (
              <View
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#111",
                  borderRadius: 14,
                  marginBottom: 10,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontWeight: "800", fontSize: 16 }}>
                  {type === "incoming"
                    ? `From: ${otherName}`
                    : `To: ${otherName}`}
                </Text>

                <Text style={{ marginTop: 6 }}>
                  {item.date} • {item.startTime}-{item.endTime}
                </Text>

                <Text style={{ marginTop: 6 }}>
                  Status:{" "}
                  <Text style={{ fontWeight: "800" }}>{item.status}</Text>
                </Text>

                {item.status === "accepted" && (
                  <Pressable
                    onPress={() => onOpenChat({ id: otherId, name: otherName })}
                    style={{
                      marginTop: 10,
                      padding: 8,
                      borderWidth: 1,
                      borderRadius: 10,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text>Message</Text>
                  </Pressable>
                )}

                {type === "incoming" && item.status === "pending" && (
                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 10 }}
                  >
                    <Pressable onPress={() => update(item.id, "accepted")}>
                      <Text>Accept</Text>
                    </Pressable>

                    <Pressable onPress={() => update(item.id, "declined")}>
                      <Text>Decline</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          marginTop: 6,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          fontSize: 16,
        }}
      />
    </View>
  );
}