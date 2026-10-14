import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import {
  getIncomingRequests,
  getOutgoingRequests,
  getSavedUserId,
  updateMatchRequestStatus,
} from "../api";
import { colors, initials, radius, shadow } from "../theme";

type AppUser = { id: number; name: string; email?: string };
type RequestItem = {
  id: string;
  senderId: number;
  senderName?: string;
  senderProfileImageUrl?: string;
  receiverId: number;
  receiverName?: string;
  receiverProfileImageUrl?: string;
  hobbyName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

function formatTime(value: string) {
  const [rawHour, minute = "00"] = value.split(":");
  const hour = Number(rawHour);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function RequestsScreen({
  currentUser,
  onOpenChat,
}: {
  currentUser?: AppUser | null;
  onOpenChat?: (user: { id: number; name: string }) => void;
}) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pendingCount = useMemo(() => items.filter((item) => item.status === "pending").length, [items]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const userId = currentUser?.id || await getSavedUserId();
      if (!userId) throw new Error("Please sign in again to view your meetups.");

      const data = type === "incoming"
        ? await getIncomingRequests(userId)
        : await getOutgoingRequests(userId);
      setItems((Array.isArray(data) ? data : []).filter((item) => item.status !== "cancelled") as RequestItem[]);
    } catch (caught) {
      setItems([]);
      setError(caught instanceof Error ? caught.message : "Could not load meetups.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [type, currentUser?.id]);

  async function update(id: string, status: "accepted" | "declined" | "cancelled") {
    try {
      setWorkingId(id);
      setError("");
      await updateMatchRequestStatus(id, status);
      if (status === "cancelled") {
        setItems((current) => current.filter((item) => item.id !== id));
      } else {
        setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this meetup.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR PLANS</Text>
          <Text style={styles.title}>Meetups</Text>
          <Text style={styles.subtitle}>Confirm new invites and keep the plans you’ve made in one place.</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countNumber}>{pendingCount}</Text>
            <Text style={styles.countLabel}>waiting</Text>
          </View>
        )}
      </View>

      <View style={styles.segmented}>
        <Segment label="Incoming" active={type === "incoming"} onPress={() => setType("incoming")} />
        <Segment label="Sent" active={type === "outgoing"} onPress={() => setType("outgoing")} />
        <Pressable accessibilityLabel="Refresh meetups" onPress={load} style={styles.refreshButton}>
          <Ionicons name="refresh" size={18} color={colors.brandDark} />
        </Pressable>
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.stateText}>Checking your plans…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={items.length ? styles.list : styles.emptyList}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={30} color={colors.brand} />
              </View>
              <Text style={styles.emptyTitle}>{type === "incoming" ? "No invitations yet" : "Nothing sent yet"}</Text>
              <Text style={styles.emptyCopy}>
                {type === "incoming" ? "When someone wants to meet up, their invitation will appear here." : "Find someone with a shared hobby and suggest a time."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const incoming = type === "incoming";
            const otherId = incoming ? item.senderId : item.receiverId;
            const otherName = (incoming ? item.senderName : item.receiverName) || `User ${otherId}`;
            const working = workingId === item.id;
            return (
              <View style={styles.requestCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(otherName)}</Text>
                </View>
                <View style={styles.requestBody}>
                  <View style={styles.nameRow}>
                    <Text style={styles.personName}>{otherName}</Text>
                    <StatusChip status={item.status} />
                  </View>
                  <View style={styles.hobbyRow}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.brand} />
                    <Text style={styles.hobbyText}>{item.hobbyName || "Shared hobby"}</Text>
                  </View>
                  <Text style={styles.timeText}>{formatDate(item.date)} · {formatTime(item.startTime)}–{formatTime(item.endTime)}</Text>

                  <View style={styles.actions}>
                    {incoming && item.status === "pending" && (
                      <>
                        <ActionButton label="Accept" icon="checkmark" primary disabled={working} onPress={() => update(item.id, "accepted")} />
                        <ActionButton label="Decline" icon="close" disabled={working} onPress={() => update(item.id, "declined")} />
                      </>
                    )}
                    {item.status === "accepted" && onOpenChat && (
                      <ActionButton label="Message" icon="chatbubble-outline" primary disabled={working} onPress={() => onOpenChat({ id: otherId, name: otherName })} />
                    )}
                    <Pressable disabled={working} onPress={() => update(item.id, "cancelled")} style={styles.removeButton}>
                      <Text style={styles.removeText}>{working ? "Updating…" : incoming ? "Remove" : "Cancel"}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, active && styles.segmentActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatusChip({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  return (
    <View style={[styles.statusChip, normalized === "accepted" ? styles.statusAccepted : normalized === "pending" ? styles.statusPending : styles.statusMuted]}>
      <Text style={[styles.statusText, normalized === "accepted" && styles.statusTextAccepted]}>{normalized}</Text>
    </View>
  );
}

function ActionButton({ label, icon, primary, disabled, onPress }: { label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; primary?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, primary && styles.actionPrimary, (pressed || disabled) && styles.pressed]}>
      <Ionicons name={icon} size={17} color={primary ? "#FFFFFF" : colors.brandDark} />
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas, padding: 22 },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 16 },
  headerCopy: { flex: 1, maxWidth: 650 },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 32, fontWeight: "900", marginTop: 7 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 7 },
  countPill: { minWidth: 86, borderRadius: radius.lg, backgroundColor: colors.accentSoft, padding: 12, alignItems: "center" },
  countNumber: { color: "#8B5B00", fontSize: 22, fontWeight: "900" },
  countLabel: { color: "#8B5B00", fontSize: 11, fontWeight: "700" },
  segmented: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 20, marginBottom: 14, padding: 4, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segment: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.brandSoft },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: "800" },
  segmentTextActive: { color: colors.brandDark },
  refreshButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 12, marginBottom: 12 },
  errorText: { flex: 1, color: colors.danger, fontWeight: "600", fontSize: 13 },
  stateBox: { flex: 1, minHeight: 260, alignItems: "center", justifyContent: "center", gap: 10 },
  stateText: { color: colors.muted, fontWeight: "600" },
  list: { paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  emptyCard: { alignSelf: "center", maxWidth: 420, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 30 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: "900", marginTop: 14 },
  emptyCopy: { color: colors.muted, textAlign: "center", lineHeight: 21, marginTop: 7 },
  requestCard: { flexDirection: "row", gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18, marginBottom: 12, ...(shadow as object) },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#795000", fontWeight: "900" },
  requestBody: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  personName: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: "900" },
  hobbyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  hobbyText: { color: colors.brandDark, fontSize: 13, fontWeight: "800" },
  timeText: { color: colors.muted, fontSize: 13, marginTop: 6 },
  statusChip: { borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 9, backgroundColor: colors.surfaceMuted },
  statusAccepted: { backgroundColor: colors.brandSoft },
  statusPending: { backgroundColor: colors.accentSoft },
  statusMuted: { backgroundColor: colors.surfaceMuted },
  statusText: { color: colors.muted, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  statusTextAccepted: { color: colors.brand },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 14 },
  actionButton: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13, backgroundColor: colors.surface },
  actionPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  actionText: { color: colors.brandDark, fontSize: 12, fontWeight: "900" },
  actionTextPrimary: { color: "#FFFFFF" },
  removeButton: { paddingVertical: 9, paddingHorizontal: 8 },
  removeText: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.65 },
});
