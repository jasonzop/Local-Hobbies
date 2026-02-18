import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View, FlatList, Pressable } from "react-native";
import { api } from "./src/lib/api";

type Hobby = { id: number; name: string };

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);

  async function load() {
    try {
      setError(null);
      setLoading(true);
      const data = await api.get<Hobby[]>("/hobbies");
      setHobbies(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load hobbies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Local Hobbies</Text>
        <Pressable
          onPress={load}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 }}
        >
          <Text>Refresh</Text>
        </Pressable>
      </View>

      <Text style={{ marginTop: 8, opacity: 0.7 }}>Pick a hobby to start matching.</Text>

      {loading && <Text style={{ marginTop: 16 }}>Loading...</Text>}

      {error && (
        <View style={{ marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1 }}>
          <Text style={{ fontWeight: "700" }}>Error</Text>
          <Text style={{ marginTop: 6 }}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          style={{ marginTop: 16 }}
          data={hobbies}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View style={{ padding: 14, borderRadius: 14, borderWidth: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
              <Text style={{ marginTop: 6, opacity: 0.7 }}>Tap later to view availability + discover.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
