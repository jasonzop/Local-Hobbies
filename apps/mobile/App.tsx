import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  api,
  getDiscoverUsers,
  getIncomingRequests,
  getOutgoingRequests,
  sendMatchRequest,
  updateMatchRequestStatus,
  MatchRequest,
  User,
} from "./src/lib/api";
import CreateProfileScreen from "./src/lib/screens/CreateProfileScreen";
import AvailabilityScreen from "./src/lib/screens/AvailabilityScreen";
import LoginScreen from "./src/lib/screens/LoginScreen";
import HobbiesScreen from "./src/lib/screens/HobbiesScreen";
import Footer from "./src/lib/components/Footer";
import ChatScreen from "./src/lib/screens/ChatScreen";
import TopBar from "./src/lib/components/TopBar";
import RequestsScreen from "./src/lib/screens/RequestsScreen";
import ProfileScreen from "./src/lib/screens/ProfileScreen";
import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";

type AppUser = {
  id: number;
  name: string;
  email: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  hobbies?: string[];
};



type Hobby = { id: number; name: string };


const FALLBACK_HOBBIES: Hobby[] = [
  { id: 1, name: "Music" },
  { id: 2, name: "Tennis" },
  { id: 3, name: "Basketball" },
  { id: 4, name: "Photography" },
  { id: 5, name: "Gym" },
  { id: 6, name: "Gaming" },
  { id: 7, name: "Study Group" },
  { id: 8, name: "Cooking" },
];


export default function App() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [chatUser, setChatUser] = useState<{
  id: number;
  name: string;
} | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [tab, setTab] = useState<
    "availability" | "hobbies" | "requests" | "profile"
  >("availability");
const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  useEffect(() => {
  const resetAndCheck = async () => {
    try {

      const savedUser = await AsyncStorage.getItem("user");

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setLoggedIn(true);
      } else {
        setUser(null);
        setLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking login:", error);
      setUser(null);
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  resetAndCheck();
}, []);

const handleLoginSuccess = async (isNewUser = false) => {
  try {
    const savedUser = await AsyncStorage.getItem("user");

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setLoggedIn(true);
      setNeedsProfileSetup(isNewUser);
    } else {
      setUser(null);
      setLoggedIn(false);
      setNeedsProfileSetup(false);
    }
  } catch (error) {
    console.error("Login success refresh error:", error);
    setUser(null);
    setLoggedIn(false);
    setNeedsProfileSetup(false);
  }
};

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUser(null);
      setLoggedIn(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
  await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  setUser(updatedUser);
  setNeedsProfileSetup(false);
}}
    />
  );
}
  if (user && chatUser) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="LOCAL HOBBIES" onLogout={handleLogout} />
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
    <TopBar title="LOCAL HOBBIES" onLogout={handleLogout} />

    <View style={{ flex: 1, padding: 16 }}>
      {tab === "availability" && <AvailabilityScreen user={user} />}
      {tab === "hobbies" && <HobbiesScreen user={user} />}
      {tab === "requests" && <RequestsScreen currentUser={user} onOpenChat={setChatUser} />}
      {tab === "profile" && (
  <ProfileScreen
    user={user}
    onLogout={handleLogout}
    onUserUpdated={(updatedUser) => setUser(updatedUser as AppUser)}
  />
)}
    </View>

    <Footer tab={tab} setTab={setTab} />
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
              item.senderId === currentUser.id
                ? item.receiverId
                : item.senderId;

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
                    onPress={() =>
                      onOpenChat({ id: otherId, name: otherName })
                    }
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