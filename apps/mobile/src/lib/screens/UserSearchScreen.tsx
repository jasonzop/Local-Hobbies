import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { checkFriendRequestExists, searchUsers, sendFriendRequest, User } from "../api";
import { colors, initials, radius, shadow } from "../theme";

export default function UserSearchScreen({
  currentUser,
  onBack,
  onOpenProfile,
}: {
  currentUser: User;
  onBack: () => void;
  onOpenProfile: (userId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [hobby, setHobby] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sentRequests, setSentRequests] = useState<Record<number, boolean>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const results = await searchUsers({ query, hobby, currentUserId: currentUser.id });
        if (!active) return;
        setUsers(results);

        const statuses = await Promise.all(
          results.map(async (user) => [user.id, await checkFriendRequestExists(currentUser.id, user.id)] as const)
        );
        if (active) setSentRequests(Object.fromEntries(statuses));
      } catch (caught) {
        if (active) {
          setUsers([]);
          setError(caught instanceof Error ? caught.message : "Could not search right now.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, hobby, currentUser.id]);

  async function addFriend(receiverId: number) {
    try {
      setSendingId(receiverId);
      setError("");
      await sendFriendRequest(currentUser.id, receiverId);
      setSentRequests((current) => ({ ...current, [receiverId]: true }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the friend request.");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR COMMUNITY</Text>
          <Text style={styles.title}>Find people nearby</Text>
          <Text style={styles.subtitle}>Search by name or narrow things down to a hobby you both enjoy.</Text>
        </View>
        <Pressable onPress={onBack} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.brandDark} />
        </Pressable>
      </View>

      <View style={styles.searchPanel}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or email"
            placeholderTextColor={colors.subtle}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>
        <View style={styles.searchInputWrap}>
          <Ionicons name="sparkles-outline" size={20} color={colors.muted} />
          <TextInput
            value={hobby}
            onChangeText={setHobby}
            placeholder="Filter by hobby"
            placeholderTextColor={colors.subtle}
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.input}
          />
        </View>
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>{loading ? "Searching" : `${users.length} ${users.length === 1 ? "person" : "people"} found`}</Text>
        {(query || hobby) && !loading && (
          <Pressable onPress={() => { setQuery(""); setHobby(""); }}>
            <Text style={styles.clearText}>Clear filters</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.stateText}>Finding good matches…</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Ionicons name="people-outline" size={30} color={colors.brand} /></View>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyCopy}>Try a broader name or hobby, or clear your filters to see everyone.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {users.map((item) => {
            const alreadySent = sentRequests[item.id];
            const sending = sendingId === item.id;
            return (
              <Pressable key={item.id} onPress={() => onOpenProfile(item.id)} style={({ pressed }) => [styles.personCard, pressed && styles.pressed]}>
                <View style={styles.personTop}>
                  {item.profileImageUrl ? (
                    <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarText}>{initials(item.name)}</Text>
                    </View>
                  )}
                  <View style={styles.personMeta}>
                    <Text style={styles.personName} numberOfLines={1}>{item.name || "Local hobbyist"}</Text>
                    {item.distanceMiles !== undefined && (
                      <View style={styles.distanceRow}>
                        <Ionicons name="location-outline" size={14} color={colors.brand} />
                        <Text style={styles.distanceText}>{item.distanceMiles.toFixed(1)} miles away</Text>
                      </View>
                    )}
                  </View>
                </View>

                {!!item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}

                {!!item.hobbies?.length && (
                  <View style={styles.hobbies}>
                    {item.hobbies.slice(0, 3).map((name) => (
                      <View key={name} style={styles.hobbyChip}><Text style={styles.hobbyText}>{name}</Text></View>
                    ))}
                    {item.hobbies.length > 3 && <Text style={styles.moreText}>+{item.hobbies.length - 3}</Text>}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.profileLink}>View profile</Text>
                  <Pressable
                    disabled={alreadySent || sending}
                    onPress={(event) => {
                      event.stopPropagation();
                      addFriend(item.id);
                    }}
                    style={[styles.addButton, alreadySent && styles.addButtonDone]}
                  >
                    <Ionicons name={alreadySent ? "checkmark" : "person-add-outline"} size={17} color={alreadySent ? colors.brand : "#FFFFFF"} />
                    <Text style={[styles.addButtonText, alreadySent && styles.addButtonTextDone]}>{sending ? "Sending…" : alreadySent ? "Requested" : "Connect"}</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  page: { padding: 22, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 18 },
  headerCopy: { flex: 1, maxWidth: 660 },
  eyebrow: { color: colors.brand, fontWeight: "900", fontSize: 11, letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: "900", marginTop: 7 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 7 },
  closeButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  searchPanel: { flexDirection: "row", flexWrap: "wrap", gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12, marginTop: 20, ...(shadow as object) },
  searchInputWrap: { flex: 1, minWidth: 220, minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 12, outlineStyle: "none" } as any,
  errorBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 12, marginTop: 12 },
  errorText: { flex: 1, color: colors.danger, fontWeight: "600", fontSize: 13 },
  resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 12 },
  resultsTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  clearText: { color: colors.brand, fontSize: 13, fontWeight: "800" },
  stateBox: { minHeight: 260, alignItems: "center", justifyContent: "center", gap: 10 },
  stateText: { color: colors.muted, fontWeight: "600" },
  emptyCard: { alignSelf: "center", maxWidth: 420, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 30, marginTop: 35 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: "900", marginTop: 14 },
  emptyCopy: { color: colors.muted, textAlign: "center", lineHeight: 21, marginTop: 7 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  personCard: { flexGrow: 1, flexBasis: 320, minWidth: 280, maxWidth: 560, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 17, ...(shadow as object) },
  personTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: { backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#795000", fontWeight: "900" },
  personMeta: { flex: 1 },
  personName: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  distanceText: { color: colors.brand, fontSize: 12, fontWeight: "700" },
  bio: { color: colors.muted, lineHeight: 20, marginTop: 13 },
  hobbies: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 13 },
  hobbyChip: { backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 9 },
  hobbyText: { color: colors.brandDark, fontSize: 11, fontWeight: "800" },
  moreText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 13, marginTop: 15 },
  profileLink: { color: colors.brand, fontSize: 12, fontWeight: "900" },
  addButton: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.sm, paddingHorizontal: 12, backgroundColor: colors.brand },
  addButtonDone: { backgroundColor: colors.brandSoft },
  addButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  addButtonTextDone: { color: colors.brand },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
