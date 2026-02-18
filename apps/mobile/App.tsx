import React, { useEffect, useMemo, useState } from "react";
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
  const [tab, setTab] = useState<"hobbies" | "requests" | "health">("hobbies");

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
        {tab === "hobbies" && <HobbiesTab />}
        {tab === "requests" && <RequestsTab />}
        {tab === "health" && <HealthTab />}
      </View>

      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          padding: 10,
          gap: 10,
          justifyContent: "space-around",
        }}
      >
        <TabButton label="Hobbies" active={tab === "hobbies"} onPress={() => setTab("hobbies")} />
        <TabButton label="Requests" active={tab === "requests"} onPress={() => setTab("requests")} />
        <TabButton label="Health" active={tab === "health"} onPress={() => setTab("health")} />
      </View>
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const data = await api.get<Hobby[]>("/hobbies");
        setHobbies(data);
        setSelected(data[0] ?? null);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load hobbies");
      }
    })();
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
    if (!selected) return;
    try {
      setError(null);
      setBusy(true);

      // save my availability
      await api.post("/me/availability", { date, startTime, endTime });

      // discover
      const data = await api.get<DiscoverResult[]>(`/discover?${qs}`);
      setResults(data);
    } catch (e: any) {
      setError(e?.message ?? "Discover failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendRequest(receiverId: string) {
    if (!selected) return;
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
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
            <Field label="Start (HH:mm)" value={startTime} onChange={setStartTime} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="End (HH:mm)" value={endTime} onChange={setEndTime} />
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
          <View style={{ marginTop: 6, padding: 12, borderRadius: 12, borderWidth: 1 }}>
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
            <View key={r.userId} style={{ padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "800" }}>
                {r.displayName} • {r.distanceMiles} mi
              </Text>
              <Text style={{ marginTop: 6, opacity: 0.8 }}>{r.bio}</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <Text style={{ opacity: 0.7 }}>{requestStatus[r.userId] ?? ""}</Text>
                <Pressable
                  onPress={() => sendRequest(r.userId)}
                  style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 }}
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

  async function load() {
    try {
      setError(null);
      const data = await api.get<MatchRequest[]>(`/me/requests?type=${type}`);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load requests");
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

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Requests</Text>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <Pressable
          onPress={() => setType("incoming")}
          style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, opacity: type === "incoming" ? 1 : 0.6 }}
        >
          <Text style={{ fontWeight: "700" }}>Incoming</Text>
        </Pressable>
        <Pressable
          onPress={() => setType("outgoing")}
          style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, opacity: type === "outgoing" ? 1 : 0.6 }}
        >
          <Text style={{ fontWeight: "700" }}>Outgoing</Text>
        </Pressable>

        <Pressable
          onPress={load}
          style={{ marginLeft: "auto", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1 }}
        >
          <Text style={{ fontWeight: "700" }}>Refresh</Text>
        </Pressable>
      </View>

      {error && (
        <View style={{ marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 }}>
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
              {type === "incoming" ? `From: ${item.senderKey}` : `To: ${item.receiverId}`}
            </Text>
            <Text style={{ marginTop: 6, opacity: 0.8 }}>
              Hobby #{item.hobbyId} • {item.date} • {item.startTime.slice(0,5)}-{item.endTime.slice(0,5)}
            </Text>
            <Text style={{ marginTop: 6 }}>Status: <Text style={{ fontWeight: "800" }}>{item.status}</Text></Text>

            {type === "incoming" && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable onPress={() => update(item.id, "accepted")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 }}>
                  <Text style={{ fontWeight: "700" }}>Accept</Text>
                </Pressable>
                <Pressable onPress={() => update(item.id, "declined")} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 }}>
                  <Text style={{ fontWeight: "700" }}>Decline</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={{ marginTop: 14, opacity: 0.7 }}>No requests yet.</Text>}
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
      <Pressable onPress={load} style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, alignSelf: "flex-start" }}>
        <Text style={{ fontWeight: "700" }}>Refresh</Text>
      </Pressable>

      {err ? (
        <View style={{ marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 }}>
          <Text style={{ fontWeight: "800" }}>Error</Text>
          <Text style={{ marginTop: 6 }}>{err}</Text>
        </View>
      ) : (
        <Text style={{ marginTop: 18, fontSize: 18 }}>API says: <Text style={{ fontWeight: "900" }}>{txt}</Text></Text>
      )}
    </View>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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
