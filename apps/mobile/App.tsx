import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AvailabilityScreen from "./AvailabilityScreen";
import LoginScreen from "./src/lib/screens/LoginScreen";

import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";
import { api } from "./src/lib/api";

type Hobby = { id: number; name: string };

type DiscoverResult = {
  userId: string;
  displayName: string;
  bio: string;
  distanceMiles: number;
};

type MatchRequest = {
  id: string;
  senderKey: string;
  receiverId: string;
  hobbyId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
};

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
  const [tab, setTab] = useState<"availability" | "hobbies" | "requests" | "health" | "profile">("availability");

useEffect(() => {
  const checkLogin = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");
      setLoggedIn(!!user && !!token);
    } catch (error) {
      console.error("Error checking login:", error);
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  checkLogin();
}, []);

const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    setLoggedIn(false);
  } catch (error) {
    console.error("Logout error:", error);
  }
};

if (loading) {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading...</Text>
    </SafeAreaView>
  );
}

  if (!loggedIn) {
    return <LoginScreen onLoginSuccess={() => setLoggedIn(true)} />;
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
          <Text style={{ fontSize: 22, fontWeight: "800" }}>Local Hobbies</Text>

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
        {tab === "hobbies" && <HobbiesTab />}
        {tab === "requests" && <RequestsTab />}
        {tab === "health" && <HealthTab />}
        {tab === "profile" && <ProfileTab onLogout={handleLogout} />}
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
    label="Health"
    active={tab === "health"}
    onPress={() => setTab("health")}
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

function HobbiesTab() {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [selected, setSelected] = useState<Hobby | null>(null);

  const [date, setDate] = useState(todayYYYYMMDD());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<DiscoverResult[]>([]);
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    async function loadHobbies() {
      try {
        setError(null);

        const data: any = await api.get<any>("/hobbies");
        console.log("HOBBIES RAW:", data);

        const arr =
          Array.isArray(data) ? data :
          Array.isArray(data?.hobbies) ? data.hobbies :
          Array.isArray(data?.data) ? data.data :
          Array.isArray(data?.items) ? data.items :
          Array.isArray(data?.content) ? data.content :
          null;

        if (!arr) {
          setHobbies([]);
          setError(
            "Invalid hobbies response: " +
              (typeof data === "string"
                ? data.slice(0, 120)
                : JSON.stringify(data).slice(0, 120))
          );
          return;
        }

        setHobbies(arr);
      } catch (e: any) {
        setHobbies([]);
        setError(e?.message ?? "Failed to load hobbies");
      }
    }

    loadHobbies();
  }, []);

  const qs = useMemo(() => {
    if (!selected) return "";
    const p = new URLSearchParams({
      hobbyId: String(selected.id),
      date,
      start: startTime,
      end: endTime,
    });
    return p.toString();
  }, [selected, date, startTime, endTime]);

  async function discover() {
    if (!selected) {
      setError("Please select a hobby first.");
      return;
    }

    try {
      setError(null);
      setBusy(true);

      await api.post("/me/availability", { date, startTime, endTime });

      const data = await api.get<DiscoverResult[]>(`/discover?${qs}`);
      setResults(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Discover failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendRequest(receiverId: string) {
    if (!selected) {
      setError("Please select a hobby first.");
      return;
    }

    try {
      setRequestStatus((s) => ({ ...s, [receiverId]: "sending..." }));

      const r = await api.post<MatchRequest>("/requests", {
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
              key={r.userId}
              style={{
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800" }}>
                {r.displayName} • {r.distanceMiles} mi
              </Text>
              <Text style={{ marginTop: 6, opacity: 0.8 }}>{r.bio}</Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <Text style={{ opacity: 0.7 }}>
                  {requestStatus[r.userId] ?? ""}
                </Text>

                <Pressable
                  onPress={() => sendRequest(r.userId)}
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

  async function load() {
    try {
      setError(null);
      const data = await api.get<MatchRequest[]>(`/me/requests?type=${type}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load requests");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, [type]);

  async function update(id: string, status: string) {
    try {
      setError(null);
      await api.patch(`/requests/${id}`, { status });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Update failed");
    }
  }

  useEffect(() => {
  async function loadHobbies() {
    try {
      const data: any = await api.get<any>("/hobbies");

      const arr =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.hobbies)
          ? data.hobbies
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.content)
          ? data.content
          : [];

      const map: Record<number, string> = {};

      arr.forEach((h: { id: number; name: string }) => {
        map[h.id] = h.name;
      });

      setHobbyMap(map);
    } catch (error) {
      console.error("Failed to load hobbies:", error);
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
          <Text style={{ fontWeight: "700" }}>Refresh</Text>
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
                ? `From: ${item.senderKey}`
                : `To: ${item.receiverId}`}
            </Text>

            <Text style={{ marginTop: 6, opacity: 0.8 }}>
  {hobbyMap[item.hobbyId] || `Hobby #${item.hobbyId}`} • {item.date} •{" "}
  {item.startTime.slice(0, 5)}-{item.endTime.slice(0, 5)}
</Text>

            <Text style={{ marginTop: 6 }}>
              Status: <Text style={{ fontWeight: "800" }}>{item.status}</Text>
            </Text>

            {type === "incoming" && (
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
          <Text style={{ marginTop: 14, opacity: 0.7 }}>No requests yet.</Text>
        }
      />
    </View>
  );
}

function HealthTab() {
  const [txt, setTxt] = useState<string>("(loading...)");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setErr(null);
      const t = await api.get<string>("/health");
      setTxt(String(t));
    } catch (e: any) {
      setErr(e?.message ?? "Health check failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Health</Text>

      <Pressable
        onPress={load}
        style={{
          marginTop: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 14,
          borderWidth: 1,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Refresh</Text>
      </Pressable>

      {err ? (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontWeight: "800" }}>Error</Text>
          <Text style={{ marginTop: 6 }}>{err}</Text>
        </View>
      ) : (
        <Text style={{ marginTop: 18, fontSize: 18 }}>
          API says: <Text style={{ fontWeight: "900" }}>{txt}</Text>
        </Text>
      )}
    </View>
  );
}

function ProfileTab({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<{
    id?: number;
    name?: string;
    email?: string;
    bio?: string;
  } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const savedUser = await AsyncStorage.getItem("user");

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    }

    loadUser();
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Profile</Text>
      <Text style={{ marginTop: 6, opacity: 0.7 }}>Your account details</Text>

      <View
        style={{
          marginTop: 20,
          padding: 20,
          borderRadius: 16,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "800" }}>{initials}</Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "800" }}>
          {user?.name || "No name found"}
        </Text>

        <Text style={{ marginTop: 6, opacity: 0.7 }}>
          {user?.email || "No email found"}
        </Text>
      </View>

      <View
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
        }}
      >
        <Text style={{ fontSize: 12, opacity: 0.7 }}>Bio</Text>
        <Text style={{ marginTop: 8, fontSize: 15 }}>
          {user?.bio || "No bio added yet."}
        </Text>
      </View>

      <Pressable
        onPress={() => {}}
        style={{
          marginTop: 16,
          paddingVertical: 12,
          borderRadius: 14,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "800" }}>Edit Profile</Text>
      </Pressable>

      <Pressable
        onPress={onLogout}
        style={{
          marginTop: 12,
          paddingVertical: 12,
          borderRadius: 14,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "800" }}>Logout</Text>
      </Pressable>
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