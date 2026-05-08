import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../api";

const screenWidth = Dimensions.get("window").width;
const isMobile = screenWidth < 768;
const isSmallMobile = screenWidth < 430;

type User = {
  id: number;
  name?: string;
  email?: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const START_HOUR = 6;
const END_HOUR = 23;

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

  if (hour >= 23) {
    return "23:59";
  }

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

      setSelected((prev) => {
        const cleaned = { ...prev };

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
          <View style={styles.headerLeft}>
            <Text style={styles.title}>MY AVAILABILITY</Text>
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
                  <Text
                    style={styles.dayHeaderText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {DAYS[i]}
                  </Text>
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
              {saving ? "Saving..." : "SAVE AVAILABILITY"}
            </Text>
          </Pressable>

          <Text style={styles.footerText}>
            TAP BOXES TO TOGGLE AVAILABILITY. GREEN MEANS AVAILABLE
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
    backgroundColor: "#34692e",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 1000,
    paddingTop: 24,
    paddingHorizontal: isSmallMobile ? 6 : isMobile ? 8 : 16,
  },
  header: {
    flexDirection: isMobile ? "column" : "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: isMobile ? 8 : 0,
  },
  headerLeft: {
    maxWidth: isMobile ? "100%" : undefined,
  },
  title: {
    fontSize: isSmallMobile ? 20 : isMobile ? 22 : 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    color: "#000000",
    fontSize: isSmallMobile ? 12 : isMobile ? 13 : 16,
  },
  headerRight: {
    flexDirection: "row",
    gap: isSmallMobile ? 4 : isMobile ? 6 : 8,
    flexWrap: isMobile ? "wrap" : "nowrap",
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: isSmallMobile ? 5 : isMobile ? 6 : 8,
    paddingHorizontal: isSmallMobile ? 8 : isMobile ? 10 : 12,
    borderRadius: 999,
  },
  smallBtnText: {
    fontWeight: "700",
    fontSize: isSmallMobile ? 12 : isMobile ? 13 : 16,
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
    width: isSmallMobile ? 42 : isMobile ? 48 : 70,
  },
  dayHeaderCell: {
    width: isSmallMobile ? 66 : isMobile ? 74 : 78,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: isMobile ? 0 : 61,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 1,
  },
  dayHeaderText: {
    fontWeight: "800",
    fontSize: isSmallMobile ? 11 : isMobile ? 13 : 16,
    maxWidth: "100%",
  },
  dayHeaderSub: {
    color: "#000000",
    marginTop: 2,
    fontSize: isSmallMobile ? 11 : isMobile ? 12 : 16,
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
    width: isSmallMobile ? 42 : isMobile ? 48 : 70,
    alignItems: "flex-start",
    paddingRight: isSmallMobile ? 2 : isMobile ? 4 : 8,
  },
  timeText: {
    color: "#000000",
    fontWeight: "900",
    fontSize: isSmallMobile ? 11 : isMobile ? 12 : 16,
  },
  cell: {
    width: isSmallMobile ? 66 : isMobile ? 74 : 70,
    height: 38,
    borderRadius: 10,
    paddingHorizontal: isMobile ? 0 : 60,
    marginHorizontal: 1,
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
    color: "#000000",
    fontSize: isSmallMobile ? 12 : isMobile ? 13 : 16,
  },
});