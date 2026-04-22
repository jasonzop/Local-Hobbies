import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";

// Mon -> Sun
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 6am -> 12am (midnight). We'll render 6..23
const START_HOUR = 6;
const END_HOUR = 24; // exclusive

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
  const day = date.getDay(); // Sun=0..Sat=6
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

type AvailabilityMap = Record<string, boolean>;

export default function AvailabilityScreen() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(new Date())
  );
  const [selected, setSelected] = useState<AvailabilityMap>({});

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const hours = useMemo(() => {
    return Array.from(
      { length: END_HOUR - START_HOUR },
      (_, i) => START_HOUR + i
    );
  }, []);

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
          <Text style={styles.footerText}>
            Tap boxes to toggle availability (green = available).
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
  },
  footerText: {
    color: "#666",
  },
});