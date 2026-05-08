import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { api, getDiscoverUsers, sendMatchRequest, User } from "../api";

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

const RADIUS_OPTIONS = [1, 5, 10, 25, 50, 100];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayYYYYMMDD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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
      <Text style={{ fontSize: 12, fontWeight: "900" }}>DATE</Text>

      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{
          marginTop: 6,
          borderWidth: 3,
          borderColor: "#000000",
          borderRadius: 14,
          paddingVertical: 2,
          paddingHorizontal: 14,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700" }}>{value} ▼</Text>
      </Pressable>

      {open && (
        <View
          style={{
            marginTop: 8,
            borderWidth: 3,
            borderColor: "#000000",
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
      <Text
        style={{
          fontSize: 12,
          fontWeight: "900",
          color: "#000000",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{
          borderWidth: 3,
          borderColor: "#000000",
          borderRadius: 14,
          paddingVertical: 2,
          paddingHorizontal: 14,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "700" }}>{value} ▼</Text>
      </Pressable>

      {open && (
        <View
          style={{
            marginTop: 8,
            borderWidth: 3,
            borderColor: "#000000",
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
                    paddingVertical: 2,
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

export default function HobbiesScreen({ user }: { user: AppUser | null }) {
  const [hobbies, setHobbies] = useState<Hobby[]>(FALLBACK_HOBBIES);
  const [selected, setSelected] = useState<Hobby | null>(FALLBACK_HOBBIES[1]);

  const [date, setDate] = useState(todayYYYYMMDD());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");

  const [radiusMiles, setRadiusMiles] = useState<number>(10);

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

      const data = await getDiscoverUsers(
  Number(user.id),
  date,
  startTime,
  endTime,
  radiusMiles
);

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
    <View style={{ flex: 1, backgroundColor: "#34692e", padding: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "900" }}>DISCOVER</Text>

      <Text
        style={{
          marginTop: 1,
          color: "#000000",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        PICK A HOBBY, DATE AND TIME
      </Text>

      <View
        style={{
          marginTop: 18,
          padding: 10,
          borderWidth: 3,
          borderColor: "#000000",
          borderRadius: 18,
          backgroundColor: "#6aa36b",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "900",
            color: "#000000",
            marginBottom: 8,
          }}
        >
          HOBBIES
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
                    paddingVertical: 2,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 3,
                    borderColor: "#000000",
                    backgroundColor: active ? "#1885f2" : "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      color: "#000000",
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
          padding: 8,
          borderWidth: 3,
          borderColor: "#000000",
          borderRadius: 18,
          backgroundColor: "#479420",
          gap: 12,
        }}
      >
        <CalendarDropdown value={date} onChange={setDate} />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <HourInput
              label="START HOUR"
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
              label="END HOUR"
              value={endTime}
              onChange={setEndTime}
            />
          </View>
        </View>

        <View>
  <Text
    style={{
      fontSize: 12,
      fontWeight: "900",
      color: "#000000",
      marginBottom: 6,
    }}
  >
    RADIUS
  </Text>

  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View style={{ flexDirection: "row", gap: 10 }}>
      {RADIUS_OPTIONS.map((radius) => {
        const active = radiusMiles === radius;

        return (
          <Pressable
            key={radius}
            onPress={() => setRadiusMiles(radius)}
            style={{
              paddingVertical: 2,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 3,
              borderColor: "#000000",
              backgroundColor: active ? "#1885f2" : "#fff",
            }}
          >
            <Text
              style={{
                fontWeight: "900",
                color: "#000000",
              }}
            >
              {radius} mi
            </Text>
          </Pressable>
        );
      })}
    </View>
  </ScrollView>
</View>
        <Pressable
          onPress={discover}
          disabled={busy}
          style={{
            marginTop: 4,
            backgroundColor: "#1885f2",
            borderColor: "#000000",
            borderWidth: 3,
            paddingVertical: 2,
            borderRadius: 14,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#000000",
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
            padding: 8,
            borderWidth: 3,
            borderColor: "#000000",
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
              padding: 8,
              borderRadius: 18,
              borderWidth: 3,
              borderColor: "#000000",
              backgroundColor: "#1885f2",
            }}
          >
            <Text style={{ color: "#000000", fontWeight: "800", fontSize: 16 }}>
              NO ONE FOUND
            </Text>
          </View>
        ) : (
          results.map((r) => {
            const key = String(r.id);
            const status = requestStatus[key];
            const disabled = status === "sent" || status === "already sent";
            const imageUrl = r.profileImageUrl?.trim();

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
                <View style={{ flexDirection: "row", gap: 14 }}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={{
                        width: 74,
                        height: 74,
                        borderRadius: 37,
                        borderWidth: 3,
                        borderColor: "#000000",
                        backgroundColor: "#ddd",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 74,
                        height: 74,
                        borderRadius: 37,
                        borderWidth: 3,
                        borderColor: "#000000",
                        backgroundColor: "#1885f2",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "900",
                          fontSize: 28,
                        }}
                      >
                        {(r.name || "U").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "900" }}>
                      {r.name ?? "Unnamed user"}
                    </Text>

                    <Text style={{ marginTop: 3, color: "#666" }}>
                      {r.email ?? ""}
                    </Text>

                    <Text
                      style={{
                        marginTop: 8,
                        color: r.bio ? "#222" : "#777",
                        fontWeight: "600",
                      }}
                    >
                      {r.bio?.trim() ? r.bio : "No bio added yet."}
                    </Text>

                    {r.distanceLabel ? (
  <Text
    style={{
      marginTop: 8,
      color: "#000000",
      fontWeight: "900",
    }}
  >
    Distance: {r.distanceLabel}
  </Text>
) : null}

<Text style={{ marginTop: 8, color: "#444" }}>
  Available {date} from {startTime} to {endTime}
</Text>
                  </View>
                </View>

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