import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  api,
  getDiscoverUsers,
  getIncomingRequests,
  getOutgoingRequests,
  sendMatchRequest,
  updateMatchRequestStatus,
  User,
} from "./src/lib/api";
import AvailabilityScreen from "./AvailabilityScreen";
import LoginScreen from "./src/lib/screens/LoginScreen";
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
  id?: number;
  name?: string;
  email?: string;
  bio?: string;
};

type Hobby = { id: number; name: string };

type MatchRequest = {
  id: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  receiverName?: string;
  hobbyId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt?: string;
};

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayYYYYMMDD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [tab, setTab] = useState<
    "availability" | "hobbies" | "requests" | "profile"
  >("availability");

  useEffect(() => {
    const checkLogin = async () => {
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

    checkLogin();
  }, []);

  const handleLoginSuccess = async () => {
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
      console.error("Login success refresh error:", error);
      setUser(null);
      setLoggedIn(false);
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

  if (!loggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800" }}>
            Local Hobbies
          </Text>

          <Pressable
            onPress={handleLogout}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
            }}
          >
            <Text style={{ fontWeight: "700" }}>Logout</Text>
          </Pressable>
        </View>

        {tab === "availability" && <AvailabilityScreen />}
        {tab === "hobbies" && <HobbiesTab user={user} />}
        {tab === "requests" && <RequestsTab />}
        {tab === "profile" && (
          <ProfileScreen user={user} onLogout={handleLogout} />
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          padding: 10,
          gap: 10,
          justifyContent: "space-around",
          flexWrap: "wrap",
        }}
      >
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

function HobbiesTab({ user }: { user: AppUser | null }) {
  const [hobbies, setHobbies] = useState<Hobby[]>(FALLBACK_HOBBIES);
  const [selected, setSelected] = useState<Hobby | null>(FALLBACK_HOBBIES[1]);

  const [date, setDate] = useState(todayYYYYMMDD());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<User[]>([]);
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    async function loadHobbies() {
      try {
        setError(null);

        const data: any = await api.get<any>("/hobbies");

        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.hobbies)
          ? data.hobbies
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.content)
          ? data.content
          : null;

        if (!arr || arr.length === 0) {
          setHobbies(FALLBACK_HOBBIES);
          if (!selected) {
            setSelected(FALLBACK_HOBBIES[1]);
          }
          return;
        }

        setHobbies(arr);
        setSelected(arr[0]);
      } catch (e: any) {
        console.error("Failed to load hobbies:", e);
        setHobbies(FALLBACK_HOBBIES);
        if (!selected) {
          setSelected(FALLBACK_HOBBIES[1]);
        }
      }
    }

    loadHobbies();
  }, []);

async function discover() {
  if (!selected) {
    setError("Please select a hobby first.");
    return;
  }

  try {
    setError(null);
    setBusy(true);

    const data = await getDiscoverUsers();

    const currentUserId = user?.id;

    const filtered = Array.isArray(data)
      ? data.filter((item) => item.id !== currentUserId)
      : [];

    setResults(filtered);
  } catch (e: any) {
    console.error("Discover failed:", e);
    setError(e?.message ?? "Discover failed");
    setResults([]);
  } finally {
    setBusy(false);
  }
}

  async function sendRequest(receiverId: string) {
    if (!selected) {
      setError("Please select a hobby first.");
      return;
    }

    if (!user?.id) {
      setError("Logged in user is missing an id.");
      return;
    }

    try {
      setRequestStatus((s) => ({ ...s, [receiverId]: "sending..." }));

      const r = await sendMatchRequest({
        senderId: String(user.id),
        receiverId,
        hobbyId: selected.id,
        date,
        startTime,
        endTime,
      });

      setRequestStatus((s) => ({ ...s, [receiverId]: `sent (${r.status})` }));
    } catch (e: any) {
      setRequestStatus((s) => ({ ...s, [receiverId]: "error" }));
      setError(e?.message ?? "Send request failed");
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Discover</Text>
      <Text style={{ marginTop: 6, opacity: 0.7 }}>
        Pick a hobby + time slot and find people.
      </Text>

      <View style={{ marginTop: 14, gap: 10 }}>
        <Text style={{ fontSize: 12, opacity: 0.7 }}>Hobby</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 6 }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            {hobbies.map((h) => (
              <Pressable
                key={h.id}
                onPress={() => setSelected(h)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  opacity: selected?.id === h.id ? 1 : 0.6,
                }}
              >
                <Text style={{ fontWeight: "700" }}>{h.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Field label="Date (YYYY-MM-DD)" value={date} onChange={setDate} />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Start (HH:mm)"
              value={startTime}
              onChange={setStartTime}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="End (HH:mm)"
              value={endTime}
              onChange={setEndTime}
            />
          </View>
        </View>

        <Pressable
          onPress={discover}
          disabled={busy}
          style={{
            marginTop: 6,
            paddingVertical: 12,
            borderRadius: 14,
            borderWidth: 1,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "800" }}>
            {busy ? "Working..." : "Discover"}
          </Text>
        </Pressable>

        {error && (
          <View
            style={{
              marginTop: 6,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
            }}
          >
            <Text style={{ fontWeight: "800" }}>Error</Text>
            <Text style={{ marginTop: 6 }}>{error}</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ marginTop: 14 }}>
        {results.length === 0 ? (
          <Text style={{ opacity: 0.7 }}>No results yet. Press Discover.</Text>
        ) : (
          results.map((r) => (
            <View
              key={String(r.id)}
              style={{
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800" }}>
                {r.name ?? "Unnamed user"}
              </Text>
              <Text style={{ marginTop: 6, opacity: 0.8 }}>
                {r.email ?? ""}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <Text style={{ opacity: 0.7 }}>
                  {requestStatus[String(r.id)] ?? ""}
                </Text>

                <Pressable
                  onPress={() => sendRequest(String(r.id))}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>Request</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function RequestsTab() {
  const [type, setType] = useState<"incoming" | "outgoing">("outgoing");
  const [items, setItems] = useState<MatchRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hobbyMap, setHobbyMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  async function getCurrentUserId() {
    const storedUser = await AsyncStorage.getItem("user");

    if (!storedUser) {
      throw new Error("No logged in user found");
    }

    const parsedUser = JSON.parse(storedUser);

    if (parsedUser?.id === undefined || parsedUser?.id === null) {
      throw new Error("Logged in user is missing an id");
    }

    return String(parsedUser.id);
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const userId = await getCurrentUserId();

      const data =
        type === "incoming"
          ? await getIncomingRequests(userId)
          : await getOutgoingRequests(userId);

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
    try {
      setError(null);
      await updateMatchRequestStatus(id, status);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Update failed");
    }
  }

  useEffect(() => {
    async function loadHobbies() {
      try {
        const data: any = await api.get<any>("/hobbies");

        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.hobbies)
          ? data.hobbies
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.content)
          ? data.content
          : FALLBACK_HOBBIES;

        const map: Record<number, string> = {};

        arr.forEach((h: { id: number; name: string }) => {
          map[h.id] = h.name;
        });

        setHobbyMap(map);
      } catch (err) {
        console.error("Failed to load hobbies:", err);
        const map: Record<number, string> = {};
        FALLBACK_HOBBIES.forEach((h) => {
          map[h.id] = h.name;
        });
        setHobbyMap(map);
      }
    }

    loadHobbies();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Requests</Text>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <Pressable
          onPress={() => setType("incoming")}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            borderWidth: 1,
            opacity: type === "incoming" ? 1 : 0.6,
          }}
        >
          <Text style={{ fontWeight: "700" }}>Incoming</Text>
        </Pressable>

        <Pressable
          onPress={() => setType("outgoing")}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            borderWidth: 1,
            opacity: type === "outgoing" ? 1 : 0.6,
          }}
        >
          <Text style={{ fontWeight: "700" }}>Outgoing</Text>
        </Pressable>

        <Pressable
          onPress={load}
          style={{
            marginLeft: "auto",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontWeight: "700" }}>
            {loading ? "Loading..." : "Refresh"}
          </Text>
        </Pressable>
      </View>

      {error && (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontWeight: "800" }}>Error</Text>
          <Text style={{ marginTop: 6 }}>{error}</Text>
        </View>
      )}

      <FlatList
        style={{ marginTop: 14 }}
        data={items}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={{ padding: 14, borderRadius: 14, borderWidth: 1 }}>
            <Text style={{ fontWeight: "800" }}>
              {type === "incoming"
                ? `From: ${item.senderName ?? item.senderId}`
                : `To: ${item.receiverName ?? item.receiverId}`}
            </Text>

            <Text style={{ marginTop: 6, opacity: 0.8 }}>
              {hobbyMap[item.hobbyId] || `Hobby #${item.hobbyId}`} • {item.date}{" "}
              • {item.startTime?.slice(0, 5)}-{item.endTime?.slice(0, 5)}
            </Text>

            <Text style={{ marginTop: 6 }}>
              Status: <Text style={{ fontWeight: "800" }}>{item.status}</Text>
            </Text>

            {type === "incoming" && item.status === "pending" && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable
                  onPress={() => update(item.id, "accepted")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>Accept</Text>
                </Pressable>

                <Pressable
                  onPress={() => update(item.id, "declined")}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>Decline</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ marginTop: 14, opacity: 0.7 }}>
            {loading ? "Loading requests..." : "No requests yet."}
          </Text>
        }
      />
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