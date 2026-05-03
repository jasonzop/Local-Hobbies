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
import AvailabilityScreen from "./src/lib/screens/AvailabilityScreen";
import LoginScreen from "./src/lib/screens/LoginScreen";
import Footer from "./src/lib/components/Footer";
import ChatScreen from "./src/lib/screens/ChatScreen";
import TopBar from "./src/lib/components/TopBar";
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
  bio?: string;
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
  const [chatUser, setChatUser] = useState<{
  id: number;
  name: string;
} | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [tab, setTab] = useState<
    "availability" | "hobbies" | "requests" | "profile"
  >("availability");

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

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
  if (user && chatUser) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="Local Hobbies" onLogout={handleLogout} />
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
  <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
    <TopBar title="Local Hobbies" onLogout={handleLogout} />

    <View style={{ flex: 1, padding: 16 }}>
      {tab === "availability" && <AvailabilityScreen user={user} />}
      {tab === "hobbies" && <HobbiesTab user={user} />}
      {tab === "requests" && <RequestsTab currentUser={user} onOpenChat={setChatUser} />}
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

function getNextDays(count: number) {
  const today = new Date();

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    return {
      label:
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
      value: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
        d.getDate()
      )}`,
    };
  });
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
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>({});

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

        setHobbies(arr.length ? arr : FALLBACK_HOBBIES);
        setSelected(arr.length ? arr[0] : FALLBACK_HOBBIES[1]);
      } catch (e) {
        console.error("Failed to load hobbies:", e);
        setHobbies(FALLBACK_HOBBIES);
        setSelected(FALLBACK_HOBBIES[1]);
      }
    }

    loadHobbies();
  }, []);

  async function discover() {
    if (!selected) {
      setError("Please select a hobby first.");
      return;
    }

    if (!user?.id) {
      setError("Logged in user is missing an id.");
      return;
    }

    try {
      setError(null);
      setBusy(true);

      const data = await getDiscoverUsers(user.id, date, startTime, endTime);

      const filtered = Array.isArray(data)
        ? data.filter((item) => item.id !== user.id)
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
      setError(null);
      setRequestStatus((s) => ({ ...s, [receiverId]: "sending" }));

      await sendMatchRequest({
        senderId: user.id,
        receiverId: Number(receiverId),
        hobbyId: selected.id,
        date,
        startTime,
        endTime,
      });

      setRequestStatus((s) => ({ ...s, [receiverId]: "sent" }));
    } catch (e: any) {
      const msg = e?.message ?? "Send request failed";

      if (msg.toLowerCase().includes("already")) {
        setRequestStatus((s) => ({ ...s, [receiverId]: "already sent" }));
      } else {
        setRequestStatus((s) => ({ ...s, [receiverId]: "error" }));
        setError(msg);
      }
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 28, fontWeight: "900" }}>Discover</Text>
      <Text style={{ marginTop: 6, color: "#666", fontSize: 16 }}>
        Pick a hobby, date, and time to find available people.
      </Text>

      <View
        style={{
          marginTop: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 18,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
          Hobby
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {hobbies.map((h) => {
              const active = selected?.id === h.id;

              return (
                <Pressable
                  key={h.id}
                  onPress={() => setSelected(h)}
                  style={{
                    paddingVertical: 11,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? "#1877f2" : "#bbb",
                    backgroundColor: active ? "#1877f2" : "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      color: active ? "#fff" : "#333",
                    }}
                  >
                    {h.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View
        style={{
          marginTop: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 18,
          backgroundColor: "#fff",
          gap: 12,
        }}
      >
        <CalendarDropdown value={date} onChange={setDate} />

<View style={{ flexDirection: "row", gap: 10 }}>
  <View style={{ flex: 1 }}>
    <HourInput
      label="Start Hour"
      value={startTime}
      onChange={(time) => {
        setStartTime(time);

        const hour = Number(time.slice(0, 2));
        const nextHour = Math.min(hour + 1, 23);
        setEndTime(`${pad2(nextHour)}:00`);
      }}
    />
  </View>

  <View style={{ flex: 1 }}>
    <HourInput
      label="End Hour"
      value={endTime}
      onChange={setEndTime}
    />
  </View>
</View>

        <Pressable
          onPress={discover}
          disabled={busy}
          style={{
            marginTop: 4,
            backgroundColor: "#1877f2",
            paddingVertical: 14,
            borderRadius: 14,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#fff",
              fontWeight: "900",
              fontSize: 16,
            }}
          >
            {busy ? "Searching..." : "Discover"}
          </Text>
        </Pressable>
      </View>

      {error && (
        <View
          style={{
            marginTop: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: "#e06666",
            borderRadius: 14,
            backgroundColor: "#fff5f5",
          }}
        >
          <Text style={{ fontWeight: "900" }}>Error</Text>
          <Text style={{ marginTop: 6 }}>{error}</Text>
        </View>
      )}

      <ScrollView style={{ marginTop: 16 }}>
        {results.length === 0 ? (
          <View
            style={{
              padding: 18,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#ddd",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ color: "#666", fontSize: 16 }}>
              No results yet. Press Discover.
            </Text>
          </View>
        ) : (
          results.map((r) => {
            const key = String(r.id);
            const status = requestStatus[key];
            const disabled = status === "sent" || status === "already sent";

            return (
              <View
                key={key}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  backgroundColor: "#fff",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "900" }}>
                  {r.name ?? "Unnamed user"}
                </Text>

                <Text style={{ marginTop: 4, color: "#666" }}>
                  {r.email ?? ""}
                </Text>

                <Text style={{ marginTop: 8, color: "#444" }}>
                  Available {date} from {startTime} to {endTime}
                </Text>

                <View
                  style={{
                    marginTop: 14,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#666", fontWeight: "700" }}>
                    {status === "sending"
                      ? "Sending..."
                      : status === "sent"
                      ? "Request sent"
                      : status === "already sent"
                      ? "Already sent"
                      : status === "error"
                      ? "Error"
                      : ""}
                  </Text>

                  <Pressable
                    disabled={disabled}
                    onPress={() => sendRequest(key)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: disabled ? "#ddd" : "#1877f2",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "900",
                        color: disabled ? "#666" : "#fff",
                      }}
                    >
                      {disabled ? "Sent" : "Connect"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function CalendarDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const days = getNextDays(30);

  return (
    <View>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>Date</Text>

      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{
          marginTop: 6,
          borderWidth: 1,
          borderColor: "#222",
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700" }}>
          {value} ▼
        </Text>
      </Pressable>

      {open && (
        <View
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            padding: 10,
            backgroundColor: "#fff",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {days.map((d) => (
            <Pressable
              key={d.value}
              onPress={() => {
                onChange(d.value);
                setOpen(false);
              }}
              style={{
                width: 120,
                paddingVertical: 10,
                paddingHorizontal: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: value === d.value ? "#1877f2" : "#ddd",
                backgroundColor: value === d.value ? "#1877f2" : "#fff",
              }}
            >
              <Text
                style={{
                  fontWeight: "800",
                  color: value === d.value ? "#fff" : "#111",
                }}
              >
                {d.label}
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: value === d.value ? "#eaf2ff" : "#666",
                }}
              >
                {d.value}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function HourInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const hours = Array.from({ length: 18 }, (_, i) => {
    const hour = pad2(i + 6);
    return `${hour}:00`;
  });

  return (
    <View>
      <Text style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{
          borderWidth: 1,
          borderColor: "#bbb",
          borderRadius: 14,
          paddingVertical: 13,
          paddingHorizontal: 14,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900" }}>{value} ▼</Text>
      </Pressable>

      {open && (
        <View
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            backgroundColor: "#fff",
            maxHeight: 220,
          }}
        >
          <ScrollView>
            {hours.map((time) => {
              const active = time === value;

              return (
                <Pressable
                  key={time}
                  onPress={() => {
                    onChange(time);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: active ? "#1877f2" : "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: active ? "#fff" : "#111",
                    }}
                  >
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
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