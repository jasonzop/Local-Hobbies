import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getIncomingRequests,
  getOutgoingRequests,
  updateMatchRequestStatus,
  deleteMatchRequest,
} from "../api";

function formatTime(time: string) {
  const hour = Number(time.split(":")[0]);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12} ${suffix}`;
}

type AppUser = {
  id: number;
  name: string;
  email?: string;
};

type RequestItem = {
  id: string;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  hobbyId?: number;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | string;
};

export default function RequestsScreen({
  currentUser,
  onOpenChat,
}: {
  currentUser?: AppUser | null;
  onOpenChat?: (user: { id: number; name: string }) => void;
}) {
  const [user, setUser] = useState<AppUser | null>(currentUser ?? null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadUser() {
    if (currentUser?.id) {
      setUser(currentUser);
      return currentUser;
    }

    const raw = await AsyncStorage.getItem("user");
    const storedUser = raw ? JSON.parse(raw) : null;
    setUser(storedUser);
    return storedUser;
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const activeUser = await loadUser();

      if (!activeUser?.id) {
        setItems([]);
        setError("User not found.");
        return;
      }

      const data =
        type === "incoming"
          ? await getIncomingRequests(Number(activeUser.id))
          : await getOutgoingRequests(Number(activeUser.id));

      setItems(
  Array.isArray(data)
    ? data.filter((request) => request.status !== "cancelled")
    : []
);
    } catch (e: any) {
      console.error("Failed to load requests:", e);
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
    await updateMatchRequestStatus(id, status);
    await load();
  } catch (e: any) {
    console.error("Failed to update request:", e);
    Alert.alert("Error", e?.message ?? "Could not update request.");
  }
}

async function removeRequest(id: string) {
  try {
    await updateMatchRequestStatus(id, "cancelled");
    setItems((prev) => prev.filter((request) => request.id !== id));
  } catch (e: any) {
    console.error("Failed to remove request:", e);
    Alert.alert("Error", e?.message ?? "Could not remove request.");
  }
}



  function getOtherId(item: RequestItem) {
    if (!user?.id) return 0;
    return item.senderId === user.id ? item.receiverId : item.senderId;
  }

  function getOtherName(item: RequestItem) {
    if (type === "incoming") {
      return item.senderName || `User ${item.senderId}`;
    }

    return item.receiverName || `User ${item.receiverId}`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#063a00", padding: 16 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "900",
          color: "#000",
          marginBottom: 14,
        }}
      >
        REQUESTS
      </Text>

      <View
        style={{
          flex: 1,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: "#000",
          backgroundColor: "#6aa36b",
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <Pressable onPress={() => setType("incoming")}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: type === "incoming" ? "#0057ff" : "#000",
              }}
            >
              Incoming
            </Text>
          </Pressable>

          <Pressable onPress={() => setType("outgoing")}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: type === "outgoing" ? "#0057ff" : "#000",
              }}
            >
              Outgoing
            </Text>
          </Pressable>

          <Pressable onPress={load} style={{ marginLeft: "auto" }}>
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#000" }}>
              {loading ? "Loading..." : "Refresh"}
            </Text>
          </Pressable>
        </View>

        {error && (
          <View
            style={{
              backgroundColor: "#ffe5e5",
              borderWidth: 2,
              borderColor: "#000",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: "900", color: "#000" }}>{error}</Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            !loading ? (
              <View
                style={{
                  backgroundColor: "#1e88e5",
                  borderWidth: 2,
                  borderColor: "#000",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <Text style={{ fontWeight: "900", color: "#000" }}>
                  No requests found
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const otherId = getOtherId(item);
            const otherName = getOtherName(item);

            return (
              <View
                style={{
                  padding: 16,
                  borderWidth: 2,
                  borderColor: "#000",
                  borderRadius: 16,
                  marginBottom: 12,
                  backgroundColor: "#fff",
                  position: "relative",
                }}
              >
                <Pressable
                  onPress={() => removeRequest(item.id)}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    borderWidth: 2,
                    borderColor: "#000",
                    backgroundColor: "#cc0000",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: "900",
                      lineHeight: 20,
                    }}
                  >
                    ×
                  </Text>
                </Pressable>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: "#000",
                    paddingRight: 40,
                  }}
                >
                  {type === "incoming"
                    ? `From: ${otherName}`
                    : `To: ${otherName}`}
                </Text>

                <Text style={{ marginTop: 8, fontSize: 16, color: "#000" }}>
                  {item.date} • {formatTime(item.startTime)} -{" "}
                  {formatTime(item.endTime)}
                </Text>

                <Text style={{ marginTop: 8, fontSize: 16, color: "#000" }}>
                  Status: <Text style={{ fontWeight: "900" }}>{item.status}</Text>
                </Text>

                {item.status === "accepted" && onOpenChat && (
                  <Pressable
                    onPress={() => onOpenChat({ id: otherId, name: otherName })}
                    style={{
                      marginTop: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "#000",
                      backgroundColor: "#1e88e5",
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>
                      Message
                    </Text>
                  </Pressable>
                )}

                {type === "incoming" && item.status === "pending" && (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    <Pressable
                      onPress={() => update(item.id, "accepted")}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: "#000",
                        backgroundColor: "#1f7a1f",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "900" }}>
                        Accept
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => update(item.id, "declined")}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: "#000",
                        backgroundColor: "#cc0000",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "900" }}>
                        Decline
                      </Text>
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