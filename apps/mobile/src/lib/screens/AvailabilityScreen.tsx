import React, { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../api";

type User = {
  id: number;
  name?: string;
  email?: string;
};


const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const START_HOUR = 6;
const END_HOUR = 24;

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatHourLabel(hour: number) {
  const isPM = hour >= 12;
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${isPM ? "PM" : "AM"}`;
}

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diffToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function toYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function addOneHour(time: string) {
  const hour = Number(time.split(":")[0]);
  return `${pad2(hour + 1)}:00`;
}

type AvailabilityMap = Record<string, boolean>;

export default function AvailabilityScreen({ user }: { user: User | null }) {

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(new Date())
  );
  const [selected, setSelected] = useState<AvailabilityMap>({});
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const hours = useMemo(() => {
    return Array.from(
      { length: END_HOUR - START_HOUR },
      (_, i) => START_HOUR + i
    );
  }, []);

useEffect(() => {
  if (!user?.id) return;

  setSelected({});

  days.forEach((d) => {
    loadAvailability(toYMD(d));
  });
}, [weekStart, user?.id]);

  function toggleCell(date: Date, hour: number) {
    const key = `${toYMD(date)}|${pad2(hour)}:00`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function clearWeek() {
    const weekKeys = new Set<string>();

    for (const d of days) {
      const ymd = toYMD(d);
      for (const h of hours) {
        weekKeys.add(`${ymd}|${pad2(h)}:00`);
      }
    }

    setSelected((prev) => {
      const next: AvailabilityMap = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!weekKeys.has(k)) {
          next[k] = v;
        }
      }
      return next;
    });
  }
async function loadAvailability(date: string) {
  if (!user?.id) return;

  try {
    const data = await api.get<any[]>(
      `/me/availability?userId=${user.id}&date=${date}`
    );

    const newSelected: Record<string, boolean> = {};

    for (const slot of data) {
      const startTime = slot.startTime?.slice(0, 5);
const key = `${slot.date}|${startTime}`;
      newSelected[key] = true;
    }

    // ✅ overwrite instead of merge
    setSelected((prev) => {
      const cleaned = { ...prev };

      // remove same-day keys before adding fresh ones
      Object.keys(cleaned).forEach((k) => {
        if (k.startsWith(date)) {
          delete cleaned[k];
        }
      });

      return { ...cleaned, ...newSelected };
    });

  } catch (err) {
    console.log("Error loading availability:", err);
  }
}

  async function saveAvailability() {
    if (!user?.id) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    const selectedSlots = Object.keys(selected).filter((key) => selected[key]);

    if (selectedSlots.length === 0) {
      Alert.alert("Nothing selected", "Please select at least one time slot.");
      return;
    }

    try {
      setSaving(true);

      for (const key of selectedSlots) {
        const [date, startTime] = key.split("|");

        await api.post("/me/availability", {
          userId: String(user.id),
          date,
          startTime,
          endTime: addOneHour(startTime),
        });
      }

      Alert.alert("Success", "Availability saved.");
    } catch (error: any) {
      console.log("Error saving availability:", error);
      Alert.alert("Error", error?.message || "Could not save availability.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Availability</Text>
            <Text style={styles.subtitle}>
              {toYMD(days[0])} — {toYMD(days[6])}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setWeekStart((w) => addDays(w, -7))}
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.smallBtnText}>Prev</Text>
            </Pressable>

            <Pressable
              onPress={() => setWeekStart((w) => addDays(w, 7))}
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.smallBtnText}>Next</Text>
            </Pressable>

            <Pressable
              onPress={clearWeek}
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.smallBtnText}>Clear</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.dayHeaderRow}>
              <View style={styles.timeColHeader} />
              {days.map((d, i) => (
                <View key={i} style={styles.dayHeaderCell}>
                  <Text style={styles.dayHeaderText}>{DAYS[i]}</Text>
                  <Text style={styles.dayHeaderSub}>{d.getDate()}</Text>
                </View>
              ))}
            </View>

            <ScrollView
              style={styles.gridScroll}
              showsVerticalScrollIndicator={true}
            >
              {hours.map((hour) => (
                <View key={hour} style={styles.row}>
                  <View style={styles.timeCol}>
                    <Text style={styles.timeText}>{formatHourLabel(hour)}</Text>
                  </View>

                  {days.map((d, idx) => {
                    const key = `${toYMD(d)}|${pad2(hour)}:00`;
                    const on = !!selected[key];

                    return (
                      <Pressable
                        key={idx}
                        onPress={() => toggleCell(d, hour)}
                        style={({ pressed }) => [
                          styles.cell,
                          on ? styles.cellOn : styles.cellOff,
                          pressed && styles.cellPressed,
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.footerHint}>
          <Pressable
            onPress={saveAvailability}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveButton,
              saving && styles.disabledButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Availability"}
            </Text>
          </Pressable>

          <Text style={styles.footerText}>
            Tap boxes to toggle availability. Green means available.
          </Text>
        </View>
      </View>
    </View>
  );

  
}


const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 1000,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    color: "#555",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: "#222",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  smallBtnText: {
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.6,
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeColHeader: {
    width: 70,
  },
  dayHeaderCell: {
    width: 78,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 4,
  },
  dayHeaderText: {
    fontWeight: "800",
  },
  dayHeaderSub: {
    color: "#666",
    marginTop: 2,
  },
  gridScroll: {
    maxHeight: 560,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeCol: {
    width: 70,
    alignItems: "flex-start",
    paddingRight: 8,
  },
  timeText: {
    color: "#555",
    fontWeight: "700",
  },
  cell: {
    width: 78,
    height: 38,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  cellOff: {
    backgroundColor: "#e6e6e6",
    borderColor: "#cfcfcf",
  },
  cellOn: {
    backgroundColor: "#7CDE6A",
    borderColor: "#4FBF3D",
  },
  cellPressed: {
    transform: [{ scale: 0.98 }],
  },
  footerHint: {
    marginTop: 12,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#1877f2",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  footerText: {
    color: "#666",
  },

  
});

