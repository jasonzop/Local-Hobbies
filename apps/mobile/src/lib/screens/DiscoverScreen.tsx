import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDiscoverUsers, sendMatchRequest, User } from "../api";

const hobbies = [
  { id: 1, label: "Music" },
  { id: 2, label: "Tennis" },
  { id: 3, label: "Basketball" },
  { id: 4, label: "Photography" },
  { id: 5, label: "Gym" },
];

export default function DiscoverScreen() {
  const [selectedHobbyId, setSelectedHobbyId] = useState<number>(2);
  const [date, setDate] = useState("2026-03-15");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      const currentUserRaw = await AsyncStorage.getItem("user");
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

      const data = await getDiscoverUsers();

      if (currentUser?.id) {
        setUsers(data.filter((user) => user.id !== currentUser.id));
      } else {
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to load discover users:", error);
      Alert.alert("Error", "Could not load real users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDiscover() {
    await loadUsers();
  }

  async function handleRequest(receiver: User) {
    try {
      const currentUserRaw = await AsyncStorage.getItem("user");
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

      if (!currentUser?.id) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      await sendMatchRequest({
        senderId: String(currentUser.id),
        receiverId: String(receiver.id),
        hobbyId: selectedHobbyId,
        date,
        startTime,
        endTime,
      });

      Alert.alert("Success", `Request sent to ${receiver.name}`);
    } catch (error) {
      console.error("Failed to send request:", error);
      Alert.alert("Error", "Could not send request.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5", padding: 20 }}>
      <Text style={{ fontSize: 32, fontWeight: "700", marginBottom: 12 }}>
        Discover
      </Text>

      <Text style={{ fontSize: 16, color: "#666", marginBottom: 14 }}>
        Pick a hobby + time slot and find people.
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 10 }}>Hobby</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
      >
        {hobbies.map((hobby) => {
          const selected = selectedHobbyId === hobby.id;

          return (
            <Pressable
              key={hobby.id}
              onPress={() => setSelectedHobbyId(hobby.id)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 18,
                borderWidth: 1,
                borderColor: "#222",
                borderRadius: 999,
                marginRight: 10,
                backgroundColor: selected ? "#ffffff" : "#f5f5f5",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                {hobby.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={{ fontSize: 16, marginBottom: 8 }}>Date (YYYY-MM-DD)</Text>
      <TextInput
        value={date}
        onChangeText={setDate}
        style={{
          borderWidth: 1,
          borderColor: "#222",
          borderRadius: 16,
          padding: 14,
          fontSize: 18,
          backgroundColor: "#fff",
          marginBottom: 16,
        }}
      />

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>Start (HH:mm)</Text>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            style={{
              borderWidth: 1,
              borderColor: "#222",
              borderRadius: 16,
              padding: 14,
              fontSize: 18,
              backgroundColor: "#fff",
            }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>End (HH:mm)</Text>
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            style={{
              borderWidth: 1,
              borderColor: "#222",
              borderRadius: 16,
              padding: 14,
              fontSize: 18,
              backgroundColor: "#fff",
            }}
          />
        </View>
      </View>

      <Pressable
        onPress={handleDiscover}
        style={{
          borderWidth: 1,
          borderColor: "#222",
          borderRadius: 18,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: 18,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700" }}>
          {loading ? "Loading..." : "Discover"}
        </Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!loading && users.length === 0 ? (
          <Text style={{ fontSize: 16, color: "#666" }}>
            No real users found yet.
          </Text>
        ) : (
          users.map((user) => (
            <View
              key={user.id}
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
                {user.name}
              </Text>

              <Text style={{ fontSize: 15, color: "#555", marginBottom: 14 }}>
                {user.email}
              </Text>

              <Pressable
                onPress={() => handleRequest(user)}
                style={{
                  alignSelf: "flex-end",
                  borderWidth: 1,
                  borderColor: "#222",
                  borderRadius: 14,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700" }}>Request</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}