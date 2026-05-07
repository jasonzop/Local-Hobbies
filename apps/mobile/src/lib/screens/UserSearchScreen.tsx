import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { searchUsers, User } from "../api";

export default function UserSearchScreen({
  currentUser,
  onBack,
}: {
  currentUser: User;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [hobby, setHobby] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const results = await searchUsers({
        query,
        hobby,
        currentUserId: currentUser.id,
      });

      setUsers(results);
    } catch (err: any) {
      setError(err?.message || "Failed to search users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 350);

    return () => clearTimeout(timer);
  }, [query, hobby]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: "#000",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 18,
          flex: 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: "900",
              flex: 1,
            }}
          >
            USER SEARCH
          </Text>

          <Pressable
            onPress={onBack}
            style={{
              backgroundColor: "#fff",
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontWeight: "900" }}>BACK</Text>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or email..."
          placeholderTextColor="#777"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginTop: 18,
            fontSize: 16,
            fontWeight: "700",
          }}
        />

        <TextInput
          value={hobby}
          onChangeText={setHobby}
          placeholder="Optional hobby filter, example: Tennis"
          placeholderTextColor="#777"
          autoCapitalize="words"
          autoCorrect={false}
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginTop: 10,
            fontSize: 16,
            fontWeight: "700",
          }}
        />

        {loading && (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator />
          </View>
        )}

        {!!error && (
          <Text style={{ color: "red", marginTop: 12, fontWeight: "800" }}>
            {error}
          </Text>
        )}

        <ScrollView style={{ marginTop: 18 }}>
          {!loading && users.length === 0 && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "900", fontSize: 16 }}>
                No users found
              </Text>
            </View>
          )}

          {users.map((item) => (
            <View
              key={String(item.id)}
              style={{
                backgroundColor: "#111",
                borderColor: "#ddd",
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {item.profileImageUrl ? (
                <Image
                  source={{ uri: item.profileImageUrl }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    marginRight: 14,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    marginRight: 14,
                    backgroundColor: "#2f6f2f",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }}>
                    {item.name?.slice(0, 1).toUpperCase() || "U"}
                  </Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>
                  {item.name}
                </Text>

                <Text style={{ color: "#aaa", marginTop: 2 }}>{item.email}</Text>

                {!!item.distanceMiles && (
  <Text
    style={{
      color: "#60a5fa",
      marginTop: 6,
      fontWeight: "700",
    }}
  >
    {item.distanceMiles.toFixed(1)} miles away
  </Text>
)}

                {!!item.bio && (
                  <Text style={{ color: "#ddd", marginTop: 6 }} numberOfLines={2}>
                    {item.bio}
                  </Text>
                )}

                {!!item.hobbies?.length && (
                  <Text style={{ color: "#6ee7b7", marginTop: 6 }}>
                    {item.hobbies.join(", ")}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}