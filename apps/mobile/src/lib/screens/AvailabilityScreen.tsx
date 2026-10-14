import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { api, replaceAvailabilityWeek } from "../api";
import { colors, radius, shadow } from "../theme";

type User = { id: number; name?: string; email?: string };
type AvailabilitySlot = { date: string; startTime: string; endTime: string };

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 7;
const END_HOUR = 23;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function startOfWeekMonday(input: Date) {
  const date = new Date(input);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(input: Date, days: number) {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date;
}

function toYMD(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function displayHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12} ${suffix}`;
}

function displayRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: start.getFullYear() === end.getFullYear() ? undefined : "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export default function AvailabilityScreen({ user }: { user: User | null }) {
  const { width, height } = useWindowDimensions();
  const compact = width < 760;
  const dayColumnWidth = compact
    ? 112
    : Math.max(112, Math.floor((Math.min(width, 1180) - 156) / 7));
  const dayCellHeight = compact
    ? 35
    : Math.max(20, Math.min(35, Math.floor((height - 400) / 16)));
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index), []);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    async function loadWeek() {
      try {
        setLoading(true);
        setMessage(null);
        const results = await Promise.all(
          days.map((day) => api.get<AvailabilitySlot[]>(`/me/availability?userId=${user!.id}&date=${toYMD(day)}`))
        );
        if (!active) return;

        const next: Record<string, boolean> = {};
        results.flat().forEach((slot) => {
          next[`${slot.date}|${slot.startTime.slice(0, 5)}`] = true;
        });
        setSelected(next);
      } catch (error) {
        if (active) {
          setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not load this week." });
          setSelected({});
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWeek();
    return () => { active = false; };
  }, [user?.id, weekStart]);

  function toggleCell(date: Date, hour: number) {
    const key = `${toYMD(date)}|${pad2(hour)}:00`;
    setSelected((current) => ({ ...current, [key]: !current[key] }));
    setMessage(null);
  }

  function selectPreset(kind: "evenings" | "weekend" | "clear") {
    if (kind === "clear") {
      setSelected({});
      return;
    }

    const next: Record<string, boolean> = {};
    days.forEach((day, dayIndex) => {
      hours.forEach((hour) => {
        const matches = kind === "evenings" ? hour >= 18 && hour < 22 : dayIndex >= 5 && hour >= 10 && hour < 18;
        if (matches) next[`${toYMD(day)}|${pad2(hour)}:00`] = true;
      });
    });
    setSelected(next);
    setMessage(null);
  }

  async function saveAvailability() {
    if (!user?.id) return;

    const slots = Object.entries(selected)
      .filter(([, isSelected]) => isSelected)
      .map(([key]) => {
        const [date, startTime] = key.split("|");
        const startHour = Number(startTime.slice(0, 2));
        return { date, startTime, endTime: `${pad2(startHour + 1)}:00` };
      });

    try {
      setSaving(true);
      setMessage(null);
      await replaceAvailabilityWeek(user.id, toYMD(days[0]), toYMD(days[6]), slots);
      setMessage({
        tone: "success",
        text: selectedCount ? `${selectedCount} available hour${selectedCount === 1 ? "" : "s"} saved.` : "This week is now cleared.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save your availability." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.page, !compact && styles.pageDesktop]}
      showsVerticalScrollIndicator={compact}
    >
      <View style={[styles.hero, compact && styles.heroCompact, !compact && styles.heroDesktop]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>YOUR WEEK</Text>
          <Text style={[styles.title, !compact && styles.titleDesktop]}>When are you free?</Text>
          <Text style={[styles.subtitle, !compact && styles.subtitleDesktop]}>Tap the hours that work. We’ll use them to surface people who are free at the same time.</Text>
        </View>
        <View style={[styles.summaryCard, !compact && styles.summaryCardDesktop]}>
          <Text style={[styles.summaryNumber, !compact && styles.summaryNumberDesktop]}>{selectedCount}</Text>
          <Text style={styles.summaryLabel}>hours selected</Text>
        </View>
      </View>

      <View style={[styles.toolbar, !compact && styles.toolbarDesktop]}>
        <View style={styles.weekNav}>
          <CircleButton icon="chevron-back" label="Previous week" onPress={() => setWeekStart((date) => addDays(date, -7))} />
          <View>
            <Text style={styles.weekLabel}>WEEK OF</Text>
            <Text style={styles.weekRange}>{displayRange(days[0], days[6])}</Text>
          </View>
          <CircleButton icon="chevron-forward" label="Next week" onPress={() => setWeekStart((date) => addDays(date, 7))} />
        </View>

        <View style={styles.presets}>
          <Preset label="Evenings" icon="moon-outline" onPress={() => selectPreset("evenings")} />
          <Preset label="Weekend" icon="sunny-outline" onPress={() => selectPreset("weekend")} />
          <Preset label="Clear" icon="refresh-outline" onPress={() => selectPreset("clear")} />
        </View>
      </View>

      <View style={[styles.card, !compact && styles.cardDesktop]}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>Loading this week…</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={[styles.dayHeaderRow, !compact && styles.dayHeaderRowDesktop]}>
                <View style={[styles.timeHeader, !compact && styles.timeColumnDesktop]} />
                {days.map((day, index) => {
                  const today = toYMD(day) === toYMD(new Date());
                  return (
                    <View key={toYMD(day)} style={[styles.dayHeader, { width: dayColumnWidth }, !compact && styles.dayHeaderDesktop, today && styles.todayHeader]}>
                      <Text style={[styles.dayName, today && styles.todayText]}>{DAY_NAMES[index]}</Text>
                      <Text style={[styles.dayNumber, !compact && styles.dayNumberDesktop, today && styles.todayText]}>{day.getDate()}</Text>
                    </View>
                  );
                })}
              </View>

              {hours.map((hour) => (
                <View key={hour} style={[styles.hourRow, !compact && styles.hourRowDesktop]}>
                  <View style={[styles.timeColumn, !compact && styles.timeColumnDesktop]}>
                    <Text style={styles.timeText}>{displayHour(hour)}</Text>
                  </View>
                  {days.map((day) => {
                    const key = `${toYMD(day)}|${pad2(hour)}:00`;
                    const active = !!selected[key];
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: active }}
                        accessibilityLabel={`${DAY_NAMES[days.indexOf(day)]} at ${displayHour(hour)}`}
                        onPress={() => toggleCell(day, hour)}
                        style={({ pressed }) => [
                          styles.cell,
                          { width: dayColumnWidth, height: dayCellHeight },
                          active && styles.cellActive,
                          pressed && styles.cellPressed,
                        ]}
                      >
                        {active && <Ionicons name="checkmark" size={17} color="#FFFFFF" />}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {!!message && (
        <View style={[styles.message, !compact && styles.messageDesktop, message.tone === "error" ? styles.messageError : styles.messageSuccess]}>
          <Ionicons name={message.tone === "error" ? "alert-circle-outline" : "checkmark-circle-outline"} size={20} color={message.tone === "error" ? colors.danger : colors.brand} />
          <Text style={[styles.messageText, message.tone === "error" && styles.messageTextError]}>{message.text}</Text>
        </View>
      )}

      <View style={[styles.saveRow, !compact && styles.saveRowDesktop]}>
        <View style={styles.legend}>
          <View style={styles.legendSwatch} />
          <Text style={styles.legendText}>Selected and available</Text>
        </View>
        <Pressable
          disabled={saving || loading}
          onPress={saveAvailability}
          style={({ pressed }) => [styles.saveButton, !compact && styles.saveButtonDesktop, (saving || loading || pressed) && styles.buttonMuted]}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>{saving ? "Saving…" : "Save availability"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function CircleButton({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.circleButton, pressed && styles.buttonMuted]}>
      <Ionicons name={icon} size={20} color={colors.brandDark} />
    </Pressable>
  );
}

function Preset({ label, icon, onPress }: { label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.preset, pressed && styles.buttonMuted]}>
      <Ionicons name={icon} size={17} color={colors.brandDark} />
      <Text style={styles.presetText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  page: { padding: 22, paddingBottom: 34 },
  pageDesktop: { paddingTop: 8, paddingBottom: 8 },
  hero: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 20, marginBottom: 20 },
  heroDesktop: { marginBottom: 6 },
  heroCompact: { alignItems: "flex-start", flexDirection: "column" },
  heroCopy: { flex: 1, maxWidth: 690 },
  eyebrow: { color: colors.brand, fontWeight: "900", fontSize: 11, letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: "900", marginTop: 7 },
  titleDesktop: { fontSize: 25, lineHeight: 28, marginTop: 3 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  subtitleDesktop: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  summaryCard: { minWidth: 132, backgroundColor: colors.brandSoft, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 20, alignItems: "center" },
  summaryCardDesktop: { minWidth: 106, paddingVertical: 6, paddingHorizontal: 14 },
  summaryNumber: { color: colors.brandDark, fontSize: 27, fontWeight: "900" },
  summaryNumberDesktop: { fontSize: 21 },
  summaryLabel: { color: colors.brand, fontSize: 12, fontWeight: "700", marginTop: 2 },
  toolbar: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 14 },
  toolbarDesktop: { marginBottom: 5 },
  weekNav: { flexDirection: "row", alignItems: "center", gap: 12 },
  circleButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  weekLabel: { color: colors.subtle, fontWeight: "900", fontSize: 9, letterSpacing: 1.1 },
  weekRange: { color: colors.ink, fontWeight: "800", fontSize: 16, marginTop: 1 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  presetText: { color: colors.brandDark, fontSize: 12, fontWeight: "800" },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, ...(shadow as object) },
  cardDesktop: { padding: 6 },
  loadingState: { height: 350, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: colors.muted, fontWeight: "600" },
  dayHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dayHeaderRowDesktop: { marginBottom: 3 },
  timeHeader: { width: 64 },
  dayHeader: { width: 112, minHeight: 54, marginHorizontal: 3, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  dayHeaderDesktop: { minHeight: 34 },
  todayHeader: { backgroundColor: colors.accentSoft },
  dayName: { color: colors.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  dayNumber: { color: colors.ink, fontSize: 18, fontWeight: "900", marginTop: 1 },
  dayNumberDesktop: { fontSize: 15 },
  todayText: { color: "#8B5B00" },
  hourRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  hourRowDesktop: { marginBottom: 1 },
  timeColumn: { width: 64, paddingRight: 8, alignItems: "flex-end" },
  timeColumnDesktop: { width: 58 },
  timeText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  cell: { width: 112, height: 35, marginHorizontal: 3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  cellActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  cellPressed: { transform: [{ scale: 0.96 }] },
  message: { flexDirection: "row", alignItems: "center", gap: 9, borderRadius: radius.md, padding: 12, marginTop: 14 },
  messageDesktop: { paddingVertical: 3, marginTop: 3 },
  messageSuccess: { backgroundColor: colors.brandSoft },
  messageError: { backgroundColor: colors.dangerSoft },
  messageText: { flex: 1, color: colors.brandDark, fontWeight: "700", fontSize: 13 },
  messageTextError: { color: colors.danger },
  saveRow: { marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 },
  saveRowDesktop: { marginTop: 3 },
  legend: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendSwatch: { width: 15, height: 15, borderRadius: 5, backgroundColor: colors.brand },
  legendText: { color: colors.muted, fontSize: 12 },
  saveButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.md, backgroundColor: colors.brand, paddingHorizontal: 20 },
  saveButtonDesktop: { minHeight: 32 },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  buttonMuted: { opacity: 0.65 },
});
