import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getIncomingRequests,
  getOutgoingRequests,
  updateMatchRequestStatus,
  MatchRequest,
} from "../api";

const hobbyNames: Record<number, string> = {
  1: "Music",
  2: "Tennis",
  3: "Basketball",
  4: "Photography",
  5: "Gym",
};

export default function RequestsScreen() {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadRequests(selectedTab: "incoming" | "outgoing") {
    try {
      setLoading(true);

      const currentUserRaw = await AsyncStorage.getItem("user");
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

      if (!currentUser?.id) {
        setRequests([]);
        return;
      }

      const userId = String(currentUser.id);

      const data =
        selectedTab === "incoming"
          ? await getIncomingRequests(userId)
          : await getOutgoingRequests(userId);

      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests:", error);
      Alert.alert("Error", "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests(tab);
  }, [tab]);

  async function handleRefresh() {
    await loadRequests(tab);
  }

  async function handleUpdateStatus(
    requestId: string,
    status: "accepted" | "declined" | "cancelled"
  ) {
    try {
      await updateMatchRequestStatus(requestId, status);
      await loadRequests(tab);
    } catch (error) {
      console.error("Failed to update request:", error);
      Alert.alert("Error", "Could not update request.");
    }
  }

  function getDisplayName(request: MatchRequest) {
    if (tab === "incoming") {
      return request.senderName ?? request.senderId;
    }

    return request.receiverName ?? request.receiverId;
  }

  function getDisplayLabel() {
    return tab === "incoming" ? "From" : "To";
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5", padding: 20 }}>
      <Text style={{ fontSize: 32, fontWeight: "700", marginBottom: 16 }}>
        Requests
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setTab("incoming")}
            style={{
              borderWidth: 1,
              borderColor: "#222",
              borderRadius: 18,
              paddingVertical: 12,
              paddingHorizontal: 18,
              backgroundColor: tab === "incoming" ? "#fff" : "#f5f5f5",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700" }}>Incoming</Text>
          </Pressable>

          <Pressable
            onPress={() => setTab("outgoing")}
            style={{
              borderWidth: 1,
              borderColor: "#222",
              borderRadius: 18,
              paddingVertical: 12,
              paddingHorizontal: 18,
              backgroundColor: tab === "outgoing" ? "#fff" : "#f5f5f5",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700" }}>Outgoing</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleRefresh}
          style={{
            borderWidth: 1,
            borderColor: "#222",
            borderRadius: 18,
            paddingVertical: 12,
            paddingHorizontal: 18,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700" }}>Refresh</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!loading && requests.length === 0 ? (
          <Text style={{ fontSize: 16, color: "#666" }}>
            No requests yet.
          </Text>
        ) : (
          requests.map((request) => (
            <View
              key={request.id}
              style={{
                borderWidth: 1,
                borderColor: "#222",
                borderRadius: 18,
                padding: 18,
                marginBottom: 14,
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
                {getDisplayLabel()}: {getDisplayName(request)}
              </Text>

              <Text style={{ fontSize: 15, color: "#555", marginBottom: 6 }}>
                {hobbyNames[request.hobbyId] ?? `Hobby ${request.hobbyId}`} •{" "}
                {request.date} • {request.startTime}-{request.endTime}
              </Text>

              <Text style={{ fontSize: 15, color: "#555", marginBottom: 14 }}>
                Status: <Text style={{ fontWeight: "700" }}>{request.status}</Text>
              </Text>

              {tab === "incoming" && request.status === "pending" ? (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => handleUpdateStatus(request.id, "accepted")}
                    style={{
                      borderWidth: 1,
                      borderColor: "#222",
                      borderRadius: 14,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      backgroundColor: "#fff",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "700" }}>
                      Accept
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleUpdateStatus(request.id, "declined")}
                    style={{
                      borderWidth: 1,
                      borderColor: "#222",
                      borderRadius: 14,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      backgroundColor: "#fff",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "700" }}>
                      Decline
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}