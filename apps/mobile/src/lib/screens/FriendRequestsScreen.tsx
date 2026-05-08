import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  FriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  updateFriendRequest,
  User,
} from "../api";

export default function FriendRequestsScreen({
  currentUser,
  onBack,
}: {
  currentUser: User;
  onBack: () => void;
}) {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<"incoming" | "outgoing">(
    "incoming"
  );
  const [loading, setLoading] = useState(false);

  async function loadRequests() {
    try {
      setLoading(true);

      const [incomingData, outgoingData] = await Promise.all([
        getIncomingFriendRequests(currentUser.id),
        getOutgoingFriendRequests(currentUser.id),
      ]);

      setIncoming(Array.isArray(incomingData) ? incomingData : []);
      setOutgoing(Array.isArray(outgoingData) ? outgoingData : []);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function respond(
    requestId: number,
    status: "accepted" | "declined"
  ) {
    try {
      await updateFriendRequest(requestId, status);
      await loadRequests();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Could not update request.");
    }
  }

  const displayedRequests =
    selectedTab === "incoming" ? incoming : outgoing;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#000",
              fontSize: 28,
              fontWeight: "900",
            }}
          >
            FRIEND REQUESTS
          </Text>

          <Text style={{ marginTop: 8, fontWeight: "800", fontSize: 16 }}>
            Incoming: {incoming.length}
          </Text>

          <Text style={{ marginTop: 4, fontWeight: "800", fontSize: 16 }}>
            Outgoing: {outgoing.length}
          </Text>
        </View>

        <Pressable
          onPress={onBack}
          style={{
            backgroundColor: "#fff",
            paddingVertical: 9,
            paddingHorizontal: 15,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#111",
          }}
        >
          <Text style={{ fontWeight: "900" }}>BACK</Text>
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: "#6ea56a",
          borderRadius: 16,
          borderWidth: 2,
          borderColor: "#111",
          padding: 18,
          flex: 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <Pressable onPress={() => setSelectedTab("incoming")}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color:
                  selectedTab === "incoming" ? "#1877f2" : "#000",
                marginRight: 20,
              }}
            >
              Incoming
            </Text>
          </Pressable>

          <Pressable onPress={() => setSelectedTab("outgoing")}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color:
                  selectedTab === "outgoing" ? "#1877f2" : "#000",
              }}
            >
              Outgoing
            </Text>
          </Pressable>

          <Pressable
            onPress={loadRequests}
            style={{ marginLeft: "auto" }}
          >
            <Text
              style={{
                fontWeight: "900",
                fontSize: 16,
              }}
            >
              Refresh
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <ScrollView>
            {displayedRequests.length === 0 && (
              <View
                style={{
                  backgroundColor: "#2b7ddd",
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: "#111",
                }}
              >
                <Text
                  style={{
                    color: "#000",
                    fontWeight: "900",
                    fontSize: 16,
                  }}
                >
                  No requests found
                </Text>
              </View>
            )}

            {displayedRequests.map((request) => (
              <View
                key={request.id}
                style={{
                  backgroundColor: "#111",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {request.senderProfileImageUrl ? (
                  <Image
                    source={{ uri: request.senderProfileImageUrl }}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 29,
                      marginRight: 12,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 29,
                      marginRight: 12,
                      backgroundColor: "#2f6f2f",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>
                      {request.senderName?.slice(0, 1).toUpperCase() || "U"}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "900",
                      fontSize: 17,
                    }}
                  >
                    {request.senderName}
                  </Text>

                  <Text style={{ color: "#aaa", marginTop: 4 }}>
                    Status: {request.status}
                  </Text>

                  {selectedTab === "incoming" &&
                    request.status === "pending" && (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 10,
                          marginTop: 12,
                        }}
                      >
                        <Pressable
                          onPress={() =>
                            respond(request.id, "accepted")
                          }
                          style={{
                            backgroundColor: "#1877f2",
                            borderRadius: 10,
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "900",
                            }}
                          >
                            ACCEPT
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            respond(request.id, "declined")
                          }
                          style={{
                            backgroundColor: "#333",
                            borderRadius: 10,
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "900",
                            }}
                          >
                            DECLINE
                          </Text>
                        </Pressable>
                      </View>
                    )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}