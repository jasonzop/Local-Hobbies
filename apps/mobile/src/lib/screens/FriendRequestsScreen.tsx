import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FriendRequest, getIncomingFriendRequests, getOutgoingFriendRequests, updateFriendRequest, User } from "../api";
import { colors, initials, radius, shadow } from "../theme";

export default function FriendRequestsScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<"incoming" | "outgoing">("incoming");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");
      const [incomingData, outgoingData] = await Promise.all([
        getIncomingFriendRequests(currentUser.id),
        getOutgoingFriendRequests(currentUser.id),
      ]);
      setIncoming((Array.isArray(incomingData) ? incomingData : []).filter((request) => request.status !== "cancelled"));
      setOutgoing((Array.isArray(outgoingData) ? outgoingData : []).filter((request) => request.status !== "cancelled"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load friend requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, [currentUser.id]);

  async function update(requestId: number, status: "accepted" | "declined" | "cancelled") {
    try {
      setWorkingId(requestId);
      setError("");
      await updateFriendRequest(requestId, status);
      if (status === "cancelled") {
        setIncoming((current) => current.filter((request) => request.id !== requestId));
        setOutgoing((current) => current.filter((request) => request.id !== requestId));
      } else {
        setIncoming((current) => current.map((request) => request.id === requestId ? { ...request, status } : request));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update that request.");
    } finally {
      setWorkingId(null);
    }
  }

  const displayed = selectedTab === "incoming" ? incoming : outgoing;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR COMMUNITY</Text>
          <Text style={styles.title}>Friend requests</Text>
          <Text style={styles.subtitle}>Build your local circle and keep track of the people you’ve reached out to.</Text>
        </View>
        <Pressable onPress={onBack} style={styles.closeButton}><Ionicons name="close" size={22} color={colors.brandDark} /></Pressable>
      </View>

      <View style={styles.segmented}>
        <Segment label="Incoming" count={incoming.length} active={selectedTab === "incoming"} onPress={() => setSelectedTab("incoming")} />
        <Segment label="Sent" count={outgoing.length} active={selectedTab === "outgoing"} onPress={() => setSelectedTab("outgoing")} />
        <Pressable onPress={loadRequests} style={styles.refreshButton}><Ionicons name="refresh" size={18} color={colors.brandDark} /></Pressable>
      </View>

      {!!error && <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={19} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}

      {loading ? (
        <View style={styles.stateBox}><ActivityIndicator color={colors.brand} /><Text style={styles.stateText}>Checking requests…</Text></View>
      ) : displayed.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Ionicons name="person-add-outline" size={29} color={colors.brand} /></View>
          <Text style={styles.emptyTitle}>{selectedTab === "incoming" ? "Your inbox is clear" : "No sent requests"}</Text>
          <Text style={styles.emptyCopy}>{selectedTab === "incoming" ? "New friend requests will show up here." : "Use search to find someone you’d like to connect with."}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {displayed.map((request) => {
            const working = workingId === request.id;
            return (
              <View key={request.id} style={styles.requestCard}>
                {request.senderProfileImageUrl ? <Image source={{ uri: request.senderProfileImageUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{initials(request.senderName)}</Text></View>}
                <View style={styles.requestBody}>
                  <View style={styles.nameRow}><Text style={styles.name}>{request.senderName || "Local hobbyist"}</Text><Status status={request.status} /></View>
                  <Text style={styles.context}>{selectedTab === "incoming" ? "Wants to connect with you" : "You sent a friend request"}</Text>
                  <View style={styles.actions}>
                    {selectedTab === "incoming" && request.status === "pending" && <>
                      <Action label="Accept" icon="checkmark" primary disabled={working} onPress={() => update(request.id, "accepted")} />
                      <Action label="Decline" icon="close" disabled={working} onPress={() => update(request.id, "declined")} />
                    </>}
                    <Pressable disabled={working} onPress={() => update(request.id, "cancelled")} style={styles.removeButton}><Text style={styles.removeText}>{working ? "Updating…" : "Remove"}</Text></Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function Segment({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.segment, active && styles.segmentActive]}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text><View style={[styles.badge, active && styles.badgeActive]}><Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text></View></Pressable>;
}

function Status({ status }: { status: string }) {
  const accepted = status === "accepted";
  return <View style={[styles.status, accepted && styles.statusAccepted]}><Text style={[styles.statusText, accepted && styles.statusTextAccepted]}>{status}</Text></View>;
}

function Action({ label, icon, primary, disabled, onPress }: { label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; primary?: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.action, primary && styles.actionPrimary, disabled && styles.disabled]}><Ionicons name={icon} size={17} color={primary ? "#FFFFFF" : colors.brandDark} /><Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas }, page: { padding: 22, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }, headerCopy: { flex: 1, maxWidth: 650 }, eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1.4 }, title: { color: colors.ink, fontSize: 32, fontWeight: "900", marginTop: 7 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 7 }, closeButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segmented: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 20, marginBottom: 14, padding: 4, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }, segment: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, borderRadius: radius.sm }, segmentActive: { backgroundColor: colors.brandSoft }, segmentText: { color: colors.muted, fontSize: 12, fontWeight: "800" }, segmentTextActive: { color: colors.brandDark }, badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }, badgeActive: { backgroundColor: colors.brand }, badgeText: { color: colors.muted, fontSize: 10, fontWeight: "900" }, badgeTextActive: { color: "#FFFFFF" }, refreshButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 12, marginBottom: 12 }, errorText: { flex: 1, color: colors.danger, fontSize: 13, fontWeight: "600" }, stateBox: { minHeight: 270, alignItems: "center", justifyContent: "center", gap: 10 }, stateText: { color: colors.muted, fontWeight: "600" },
  emptyCard: { alignSelf: "center", maxWidth: 420, alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 30, marginTop: 42 }, emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft }, emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: "900", marginTop: 14 }, emptyCopy: { color: colors.muted, textAlign: "center", lineHeight: 21, marginTop: 6 },
  list: { gap: 11 }, requestCard: { flexDirection: "row", gap: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 17, ...(shadow as object) }, avatar: { width: 52, height: 52, borderRadius: 26 }, avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft }, avatarText: { color: "#795000", fontWeight: "900" }, requestBody: { flex: 1 }, nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 9 }, name: { flex: 1, color: colors.ink, fontSize: 17, fontWeight: "900" }, context: { color: colors.muted, fontSize: 13, marginTop: 5 }, status: { borderRadius: radius.pill, backgroundColor: colors.accentSoft, paddingVertical: 5, paddingHorizontal: 9 }, statusAccepted: { backgroundColor: colors.brandSoft }, statusText: { color: "#8B5B00", fontSize: 9, fontWeight: "900", textTransform: "uppercase" }, statusTextAccepted: { color: colors.brand },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 13 }, action: { minHeight: 37, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12 }, actionPrimary: { backgroundColor: colors.brand, borderColor: colors.brand }, actionText: { color: colors.brandDark, fontSize: 11, fontWeight: "900" }, actionTextPrimary: { color: "#FFFFFF" }, removeButton: { padding: 9 }, removeText: { color: colors.danger, fontSize: 11, fontWeight: "800" }, disabled: { opacity: 0.55 },
});
