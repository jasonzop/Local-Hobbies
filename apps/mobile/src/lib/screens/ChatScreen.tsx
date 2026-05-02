import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { getMessages, sendMessage, Message, User } from "../api";

type Props = {
  currentUser: User;
  otherUserId: number;
  otherUserName: string;
  onBack: () => void;
};

export default function ChatScreen({
  currentUser,
  otherUserId,
  otherUserName,
  onBack,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);

  async function loadMessages() {
    try {
      const data = await getMessages(currentUser.id, otherUserId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 1500);
    return () => clearInterval(interval);
  }, [currentUser.id, otherUserId]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: otherUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setContent("");

    try {
      setLoading(true);

      await sendMessage({
        senderId: currentUser.id,
        receiverId: otherUserId,
        content: trimmed,
      });

      await loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Could not send message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "#ddd",
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <Pressable onPress={onBack} style={{ marginBottom: 10 }}>
          <Text style={{ fontWeight: "800", color: "#1877f2" }}>← Back</Text>
        </Pressable>

        <Text style={{ fontSize: 24, fontWeight: "800" }}>
          Chat with {otherUserName}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => {
          const mine = item.senderId === currentUser.id;

          return (
            <View
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                backgroundColor: mine ? "#1877f2" : "#eee",
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 16,
                marginBottom: 10,
                maxWidth: "78%",
              }}
            >
              <Text style={{ color: mine ? "#fff" : "#111", fontSize: 16 }}>
                {item.content}
              </Text>

              <Text
                style={{
                  color: mine ? "#e8f1ff" : "#555",
                  fontSize: 10,
                  marginTop: 4,
                  textAlign: mine ? "right" : "left",
                }}
              >
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={{ color: "#666" }}>
            No messages yet. Start the conversation.
          </Text>
        }
      />

      <View style={{ flexDirection: "row", gap: 10, paddingTop: 10 }}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Type a message..."
          onSubmitEditing={handleSend}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
          }}
        />

        <Pressable
          onPress={handleSend}
          disabled={loading || !content.trim()}
          style={{
            backgroundColor: "#1877f2",
            paddingHorizontal: 18,
            justifyContent: "center",
            borderRadius: 14,
            opacity: loading || !content.trim() ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            {loading ? "..." : "Send"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}