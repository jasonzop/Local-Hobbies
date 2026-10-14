import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, createHobby, getDiscoverUsers, sendMatchRequest, User } from "../api";
import { colors, initials, radius, shadow } from "../theme";

type AppUser = User & { coverImageUrl?: string };
type Hobby = { id: number; name: string };

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];
const HOURS = Array.from({ length: 17 }, (_, index) => `${String(index + 6).padStart(2, "0")}:00`);

function todayYMD() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nextDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      day: index === 0 ? "Today" : index === 1 ? "Tomorrow" : date.toLocaleDateString(undefined, { weekday: "short" }),
      number: date.getDate(),
      month: date.toLocaleDateString(undefined, { month: "short" }),
    };
  });
}

function formatTime(value: string) {
  const hour = Number(value.slice(0, 2));
  return `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
}

function normalizeHobbies(data: unknown): Hobby[] {
  if (Array.isArray(data)) return data;
  const value = data as { hobbies?: Hobby[]; data?: Hobby[]; items?: Hobby[]; content?: Hobby[] } | null;
  return value?.hobbies || value?.data || value?.items || value?.content || [];
}

export default function HobbiesScreen({ user }: { user: AppUser | null }) {
  const [allHobbies, setAllHobbies] = useState<Hobby[]>([]);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [selected, setSelected] = useState<Hobby | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(user);
  const [addOpen, setAddOpen] = useState(false);
  const [hobbySearch, setHobbySearch] = useState("");
  const [addingHobby, setAddingHobby] = useState(false);
  const [date, setDate] = useState(todayYMD());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [busy, setBusy] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [requestStatus, setRequestStatus] = useState<Record<number, string>>({});
  const dates = useMemo(() => nextDays(14), []);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    async function load() {
      try {
        const [hobbyData, freshProfile] = await Promise.all([
          api.get<unknown>("/hobbies"),
          api.get<AppUser>(`/users/${user!.id}`).catch(() => user!),
        ]);
        if (!active) return;
        const available = normalizeHobbies(hobbyData);
        const names = new Set((freshProfile.hobbies || []).map((name) => name.trim().toLowerCase()));
        const current = available.filter((hobby) => names.has(hobby.name.trim().toLowerCase()));
        setAllHobbies(available);
        setProfile(freshProfile);
        setHobbies(current);
        setSelected(current[0] || null);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load hobbies.");
      }
    }

    load();
    return () => { active = false; };
  }, [user?.id]);

  async function saveUserHobbies(next: Hobby[]) {
    if (!user?.id) return;
    const current = profile || user;
    const updated = await api.patch<AppUser>(`/users/${user.id}/profile-setup`, {
      name: current.name,
      bio: current.bio || "",
      profileImageUrl: current.profileImageUrl || null,
      coverImageUrl: current.coverImageUrl || null,
      hobbies: next.map((hobby) => hobby.name),
    });
    setProfile(updated);
  }

  async function chooseHobby(hobby: Hobby) {
    const next = hobbies.some((item) => item.id === hobby.id) ? hobbies : [...hobbies, hobby];
    setHobbies(next);
    setSelected(hobby);
    await saveUserHobbies(next);
    setHobbySearch("");
    setAddOpen(false);
  }

  async function addOrCreateHobby() {
    const name = hobbySearch.trim();
    if (!name) return;

    try {
      setAddingHobby(true);
      setError("");
      const existing = allHobbies.find((hobby) => hobby.name.trim().toLowerCase() === name.toLowerCase());
      if (existing) {
        await chooseHobby(existing);
      } else {
        const created = await createHobby(name);
        setAllHobbies((current) => [...current, created]);
        await chooseHobby(created);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save that hobby.");
    } finally {
      setAddingHobby(false);
    }
  }

  async function discover() {
    if (!selected) {
      setError("Choose a hobby before searching.");
      return;
    }
    if (!user?.id) return;

    try {
      setBusy(true);
      setError("");
      setHasSearched(true);
      const data = await getDiscoverUsers(user.id, date, startTime, endTime, radiusMiles);
      setResults((Array.isArray(data) ? data : []).filter((item) => item.id !== user.id));
    } catch (caught) {
      setResults([]);
      setError(caught instanceof Error ? caught.message : "Could not search right now.");
    } finally {
      setBusy(false);
    }
  }

  async function sendRequest(receiverId: number) {
    if (!selected || !user?.id) return;
    try {
      setRequestStatus((current) => ({ ...current, [receiverId]: "sending" }));
      setError("");
      await sendMatchRequest({ senderId: user.id, receiverId, hobbyId: selected.id, date, startTime, endTime });
      setRequestStatus((current) => ({ ...current, [receiverId]: "sent" }));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not send the request.";
      const duplicate = message.toLowerCase().includes("already") || message.includes("409");
      setRequestStatus((current) => ({ ...current, [receiverId]: duplicate ? "sent" : "error" }));
      setError(duplicate ? "You already sent this person the same meetup request." : message);
    }
  }

  const hobbyMatches = hobbySearch.trim()
    ? allHobbies.filter((hobby) => hobby.name.toLowerCase().includes(hobbySearch.trim().toLowerCase())).slice(0, 6)
    : allHobbies.slice(0, 6);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>DISCOVER</Text>
          <Text style={styles.title}>Find someone to join you</Text>
          <Text style={styles.subtitle}>Choose what you want to do and when. We’ll find nearby people with matching availability.</Text>
        </View>
        <View style={styles.steps}><Step number="1" label="Pick" /><Step number="2" label="Match" /><Step number="3" label="Meet" /></View>
      </View>

      <View style={styles.plannerCard}>
        <PlannerSection number="1" title="What sounds fun?" hint="Choose one of your hobbies">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {hobbies.map((hobby) => <ChoiceChip key={hobby.id} label={hobby.name} active={selected?.id === hobby.id} onPress={() => setSelected(hobby)} />)}
            <Pressable onPress={() => setAddOpen(true)} style={styles.addChip}>
              <Ionicons name="add" size={18} color={colors.brand} />
              <Text style={styles.addChipText}>Add hobby</Text>
            </Pressable>
          </ScrollView>
        </PlannerSection>

        <View style={styles.divider} />

        <PlannerSection number="2" title="When should you meet?" hint="Pick a date and time">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((item) => {
              const active = item.value === date;
              return (
                <Pressable key={item.value} onPress={() => setDate(item.value)} style={[styles.dateCard, active && styles.dateCardActive]}>
                  <Text style={[styles.dateDay, active && styles.choiceActiveText]}>{item.day}</Text>
                  <Text style={[styles.dateNumber, active && styles.choiceActiveText]}>{item.number}</Text>
                  <Text style={[styles.dateMonth, active && styles.choiceActiveText]}>{item.month}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.timeRow}>
            <TimePicker label="Starts" value={startTime} onChange={(value) => {
              setStartTime(value);
              const hour = Math.min(Number(value.slice(0, 2)) + 1, 23);
              setEndTime(`${String(hour).padStart(2, "0")}:00`);
            }} />
            <Ionicons name="arrow-forward" size={18} color={colors.subtle} />
            <TimePicker label="Ends" value={endTime} onChange={setEndTime} />
          </View>
        </PlannerSection>

        <View style={styles.divider} />

        <PlannerSection number="3" title="How far would you go?" hint="Widen the radius for more matches">
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((value) => <ChoiceChip key={value} label={`${value} mi`} active={radiusMiles === value} onPress={() => setRadiusMiles(value)} />)}
          </View>
        </PlannerSection>

        <Pressable disabled={busy} onPress={discover} style={({ pressed }) => [styles.searchButton, (pressed || busy) && styles.pressed]}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="sparkles" size={20} color="#FFFFFF" />}
          <Text style={styles.searchButtonText}>{busy ? "Finding matches…" : "Find hobby partners"}</Text>
        </Pressable>
      </View>

      {!!error && <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={19} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}

      {hasSearched && !busy && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>{results.length ? `${results.length} ${results.length === 1 ? "person is" : "people are"} free` : "No exact matches yet"}</Text>
          <Text style={styles.resultsCopy}>{results.length ? `For ${selected?.name} on ${date}` : "Try a wider radius or a different time."}</Text>
          <View style={styles.resultsGrid}>
            {results.map((person) => {
              const status = requestStatus[person.id];
              const sent = status === "sent";
              return (
                <View key={person.id} style={styles.personCard}>
                  <View style={styles.personTop}>
                    {person.profileImageUrl ? <Image source={{ uri: person.profileImageUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{initials(person.name)}</Text></View>}
                    <View style={styles.personMeta}>
                      <Text style={styles.personName}>{person.name || "Local hobbyist"}</Text>
                      <Text style={styles.distance}>{person.distanceLabel || (person.distanceMiles !== undefined ? `${person.distanceMiles.toFixed(1)} miles away` : "Nearby")}</Text>
                    </View>
                  </View>
                  {!!person.bio && <Text style={styles.bio} numberOfLines={2}>{person.bio}</Text>}
                  <Pressable disabled={sent || status === "sending"} onPress={() => sendRequest(person.id)} style={[styles.connectButton, sent && styles.connectButtonDone]}>
                    <Ionicons name={sent ? "checkmark" : "paper-plane-outline"} size={17} color={sent ? colors.brand : "#FFFFFF"} />
                    <Text style={[styles.connectText, sent && styles.connectTextDone]}>{status === "sending" ? "Sending…" : sent ? "Request sent" : "Suggest this meetup"}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.modalEyebrow}>PERSONALIZE DISCOVERY</Text><Text style={styles.modalTitle}>Add a hobby</Text></View>
              <Pressable onPress={() => setAddOpen(false)} style={styles.modalClose}><Ionicons name="close" size={21} color={colors.brandDark} /></Pressable>
            </View>
            <View style={styles.modalInputWrap}>
              <Ionicons name="search-outline" size={19} color={colors.muted} />
              <TextInput value={hobbySearch} onChangeText={setHobbySearch} placeholder="Try pottery, tennis, hiking…" placeholderTextColor={colors.subtle} autoCapitalize="words" style={styles.modalInput} />
            </View>
            <View style={styles.suggestions}>
              {hobbyMatches.map((hobby) => (
                <Pressable key={hobby.id} disabled={addingHobby} onPress={() => chooseHobby(hobby)} style={styles.suggestion}>
                  <Text style={styles.suggestionText}>{hobby.name}</Text><Ionicons name="add-circle-outline" size={19} color={colors.brand} />
                </Pressable>
              ))}
            </View>
            {!!hobbySearch.trim() && !hobbyMatches.some((hobby) => hobby.name.toLowerCase() === hobbySearch.trim().toLowerCase()) && (
              <Pressable disabled={addingHobby} onPress={addOrCreateHobby} style={styles.createButton}>
                <Text style={styles.createButtonText}>{addingHobby ? "Saving…" : `Create “${hobbySearch.trim()}”`}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function PlannerSection({ number, title, hint, children }: { number: string; title: string; hint: string; children: React.ReactNode }) {
  return <View><View style={styles.sectionHeader}><View style={styles.sectionNumber}><Text style={styles.sectionNumberText}>{number}</Text></View><View><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionHint}>{hint}</Text></View></View><View style={styles.sectionContent}>{children}</View></View>;
}

function ChoiceChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.choiceChip, active && styles.choiceChipActive]}><Text style={[styles.choiceText, active && styles.choiceActiveText]}>{label}</Text>{active && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}</Pressable>;
}

function Step({ number, label }: { number: string; label: string }) {
  return <View style={styles.step}><View style={styles.stepDot}><Text style={styles.stepNumber}>{number}</Text></View><Text style={styles.stepLabel}>{label}</Text></View>;
}

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.timePicker}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Pressable onPress={() => setOpen((current) => !current)} style={styles.timeButton}><Ionicons name="time-outline" size={17} color={colors.brand} /><Text style={styles.timeValue}>{formatTime(value)}</Text><Ionicons name="chevron-down" size={15} color={colors.muted} /></Pressable>
      {open && <View style={styles.timeMenu}><ScrollView nestedScrollEnabled>{HOURS.map((time) => <Pressable key={time} onPress={() => { onChange(time); setOpen(false); }} style={[styles.timeOption, time === value && styles.timeOptionActive]}><Text style={[styles.timeOptionText, time === value && styles.timeOptionTextActive]}>{formatTime(time)}</Text></Pressable>)}</ScrollView></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas }, page: { padding: 22, paddingBottom: 40 },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }, headerCopy: { flex: 1, minWidth: 280, maxWidth: 680 },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1.4 }, title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: "900", marginTop: 7 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 7 },
  steps: { flexDirection: "row", gap: 14 }, step: { alignItems: "center", gap: 4 }, stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }, stepNumber: { color: colors.brand, fontSize: 11, fontWeight: "900" }, stepLabel: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  plannerCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, marginTop: 20, ...(shadow as object) },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 11 }, sectionNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }, sectionNumberText: { color: colors.brand, fontWeight: "900" }, sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" }, sectionHint: { color: colors.muted, fontSize: 11, marginTop: 2 }, sectionContent: { marginTop: 14 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  chipRow: { gap: 8, paddingRight: 4 }, choiceChip: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 38, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, choiceChipActive: { backgroundColor: colors.brand, borderColor: colors.brand }, choiceText: { color: colors.brandDark, fontSize: 12, fontWeight: "800" }, choiceActiveText: { color: "#FFFFFF" }, addChip: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 38, paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: colors.brandSoft }, addChipText: { color: colors.brand, fontSize: 12, fontWeight: "900" },
  dateRow: { gap: 8, paddingRight: 4 }, dateCard: { minWidth: 70, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center" }, dateCardActive: { backgroundColor: colors.brand, borderColor: colors.brand }, dateDay: { color: colors.muted, fontSize: 10, fontWeight: "800" }, dateNumber: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 2 }, dateMonth: { color: colors.muted, fontSize: 10, marginTop: 1 },
  timeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 10, marginTop: 14 }, timePicker: { minWidth: 150, position: "relative", zIndex: 2 }, timeLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", marginBottom: 5 }, timeButton: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12 }, timeValue: { flex: 1, color: colors.ink, fontWeight: "800" }, timeMenu: { position: "absolute", top: 66, left: 0, right: 0, maxHeight: 190, zIndex: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, overflow: "hidden", ...(shadow as object) }, timeOption: { paddingVertical: 10, paddingHorizontal: 12 }, timeOptionActive: { backgroundColor: colors.brandSoft }, timeOptionText: { color: colors.ink, fontSize: 12, fontWeight: "700" }, timeOptionTextActive: { color: colors.brand },
  radiusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, searchButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.brand, borderRadius: radius.md, marginTop: 22 }, searchButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, pressed: { opacity: 0.68 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 12, marginTop: 13 }, errorText: { flex: 1, color: colors.danger, fontSize: 13, fontWeight: "600" },
  resultsSection: { marginTop: 24 }, resultsTitle: { color: colors.ink, fontSize: 22, fontWeight: "900" }, resultsCopy: { color: colors.muted, marginTop: 4 }, resultsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 13 }, personCard: { flexGrow: 1, flexBasis: 300, maxWidth: 550, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 17, ...(shadow as object) }, personTop: { flexDirection: "row", alignItems: "center", gap: 11 }, avatar: { width: 52, height: 52, borderRadius: 26 }, avatarFallback: { backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#795000", fontWeight: "900" }, personMeta: { flex: 1 }, personName: { color: colors.ink, fontSize: 17, fontWeight: "900" }, distance: { color: colors.brand, fontSize: 12, fontWeight: "700", marginTop: 3 }, bio: { color: colors.muted, lineHeight: 20, marginTop: 12 }, connectButton: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.brand, borderRadius: radius.sm, marginTop: 14 }, connectButtonDone: { backgroundColor: colors.brandSoft }, connectText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, connectTextDone: { color: colors.brand },
  modalOverlay: { flex: 1, backgroundColor: "rgba(12, 25, 17, 0.58)", alignItems: "center", justifyContent: "center", padding: 20 }, modalCard: { width: "100%", maxWidth: 480, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, ...(shadow as object) }, modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, modalEyebrow: { color: colors.brand, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, modalTitle: { color: colors.ink, fontSize: 25, fontWeight: "900", marginTop: 5 }, modalClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }, modalInputWrap: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 48, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingHorizontal: 13, marginTop: 18 }, modalInput: { flex: 1, color: colors.ink, fontSize: 15, outlineStyle: "none" } as any, suggestions: { marginTop: 10 }, suggestion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border }, suggestionText: { color: colors.ink, fontWeight: "700" }, createButton: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.brand, marginTop: 14 }, createButtonText: { color: "#FFFFFF", fontWeight: "900" },
});
