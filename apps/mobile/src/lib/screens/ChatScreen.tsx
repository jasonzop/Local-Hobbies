import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { getMessages, sendMessage, Message, User } from "../api";
import { colors, initials, radius } from "../theme";

export default function ChatScreen({
  currentUser,
  otherUserId,
  otherUserName,
  onBack,
}: {
  currentUser: User;
  otherUserId: number;
  otherUserName: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);

  async function loadMessages(silent = false) {
    try {
      if (!silent) setLoading(true);
      const data = await getMessages(currentUser.id, otherUserId);
      setMessages(Array.isArray(data) ? data : []);
      setError("");
    } catch (caught) {
      if (!silent) setError(caught instanceof Error ? caught.message : "Could not load messages.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => loadMessages(true), 5000);
    return () => clearInterval(interval);
  }, [currentUser.id, otherUserId]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    const temporaryId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: temporaryId,
      senderId: currentUser.id,
      receiverId: otherUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimistic]);
    setContent("");
    setSending(true);
    setError("");

    try {
      await sendMessage({ senderId: currentUser.id, receiverId: otherUserId, content: trimmed });
      await loadMessages(true);
    } catch (caught) {
      setMessages((current) => current.filter((message) => message.id !== temporaryId));
      setContent(trimmed);
      setError(caught instanceof Error ? caught.message : "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.chatCard}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.brandDark} />
          </Pressable>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials(otherUserName)}</Text></View>
          <View style={styles.headerCopy}>
            <Text style={styles.name} numberOfLines={1}>{otherUserName}</Text>
            <View style={styles.statusRow}><View style={styles.statusDot} /><Text style={styles.statusText}>Conversation</Text></View>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>Loading the conversation…</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={messages.length ? styles.messages : styles.emptyMessages}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.senderId === currentUser.id;
              const pending = item.id.startsWith("temp-");
              return (
                <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther, pending && styles.pendingBubble]}>
                    <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.content}</Text>
                    <View style={styles.messageMeta}>
                      <Text style={[styles.time, mine && styles.timeMine]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </Text>
                      {mine && <Ionicons name={pending ? "time-outline" : "checkmark-done"} size={13} color={pending ? "rgba(255,255,255,0.7)" : "#D5F2DF"} />}
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={30} color={colors.brand} /></View>
                <Text style={styles.emptyTitle}>Start the conversation</Text>
                <Text style={styles.emptyCopy}>Confirm the plan, swap details, or just say hello.</Text>
              </View>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write a message…"
            placeholderTextColor={colors.subtle}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            style={styles.input}
          />
          <Pressable
            accessibilityLabel="Send message"
            disabled={sending || !content.trim()}
            onPress={handleSend}
            style={({ pressed }) => [styles.sendButton, (pressed || sending || !content.trim()) && styles.sendButtonMuted]}
          >
            <Ionicons name="send" size={19} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas, padding: 18 },
  chatCard: { flex: 1, width: "100%", maxWidth: 820, alignSelf: "center", overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  header: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 14 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
  avatarText: { color: "#795000", fontWeight: "900", fontSize: 12 },
  headerCopy: { flex: 1 },
  name: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brand },
  statusText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.dangerSoft, paddingHorizontal: 14, paddingVertical: 9 },
  errorText: { flex: 1, color: colors.danger, fontSize: 12, fontWeight: "600" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: colors.muted, fontWeight: "600" },
  messages: { padding: 16, paddingBottom: 22 },
  emptyMessages: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  bubbleWrap: { flexDirection: "row", marginBottom: 9 },
  bubbleWrapMine: { justifyContent: "flex-end" },
  bubbleWrapOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", paddingVertical: 10, paddingHorizontal: 13, borderRadius: 17 },
  bubbleMine: { backgroundColor: colors.brand, borderBottomRightRadius: 5 },
  bubbleOther: { backgroundColor: colors.surfaceMuted, borderBottomLeftRadius: 5 },
  pendingBubble: { opacity: 0.78 },
  messageText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  messageTextMine: { color: "#FFFFFF" },
  messageMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 },
  time: { color: colors.subtle, fontSize: 9 },
  timeMine: { color: "rgba(255,255,255,0.74)" },
  emptyState: { alignItems: "center", maxWidth: 320 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "900", marginTop: 13 },
  emptyCopy: { color: colors.muted, textAlign: "center", lineHeight: 20, marginTop: 6 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 9, borderTopWidth: 1, borderTopColor: colors.border, padding: 12, backgroundColor: colors.surface },
  input: { flex: 1, maxHeight: 110, minHeight: 46, color: colors.ink, fontSize: 15, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 13, paddingTop: 12, paddingBottom: 10, outlineStyle: "none" } as any,
  sendButton: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand },
  sendButtonMuted: { opacity: 0.5 },
});
