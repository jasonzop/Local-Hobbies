import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { MainTab } from "../../../App";
import { colors, radius, shadow } from "../theme";

export default function GuestExperienceScreen({
  tab,
  onExit,
}: {
  tab: MainTab;
  onExit: () => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
      <View style={styles.previewBanner}>
        <View style={styles.previewIcon}>
          <Ionicons name="eye-outline" size={18} color={colors.brandDark} />
        </View>
        <View style={styles.previewCopy}>
          <Text style={styles.previewTitle}>Guest preview</Text>
          <Text style={styles.previewText}>Sample data only · Nothing you do here changes real accounts.</Text>
        </View>
        <Pressable onPress={onExit} style={styles.exitButton}>
          <Text style={styles.exitText}>Exit</Text>
        </Pressable>
      </View>

      {tab === "availability" ? (
        <SchedulePreview />
      ) : tab === "hobbies" ? (
        <DiscoverPreview />
      ) : tab === "requests" ? (
        <MeetupsPreview />
      ) : (
        <ProfilePreview />
      )}
    </ScrollView>
  );
}

function SectionHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{copy}</Text>
    </View>
  );
}

function SchedulePreview() {
  const days = [
    { day: "MON", date: "19", active: false },
    { day: "TUE", date: "20", active: true },
    { day: "WED", date: "21", active: true },
    { day: "THU", date: "22", active: false },
    { day: "FRI", date: "23", active: true },
    { day: "SAT", date: "24", active: true },
    { day: "SUN", date: "25", active: false },
  ];

  return (
    <>
      <SectionHeader eyebrow="YOUR WEEK" title="Make room for something fun." copy="Tap a few open times and Local Hobbies can match you with people who are free too." />
      <View style={styles.card}>
        <View style={styles.weekRow}>
          {days.map((item) => (
            <View key={item.day} style={[styles.day, item.active && styles.dayActive]}>
              <Text style={[styles.dayName, item.active && styles.dayNameActive]}>{item.day}</Text>
              <Text style={[styles.dayDate, item.active && styles.dayDateActive]}>{item.date}</Text>
              <View style={[styles.availabilityDot, item.active && styles.availabilityDotActive]} />
            </View>
          ))}
        </View>
        <View style={styles.slotList}>
          <PreviewRow icon="sunny-outline" title="Tuesday afternoon" meta="2:00 PM – 5:00 PM" tag="Available" />
          <PreviewRow icon="moon-outline" title="Friday evening" meta="6:30 PM – 9:00 PM" tag="Available" />
          <PreviewRow icon="trail-sign-outline" title="Saturday morning" meta="9:00 AM – 12:00 PM" tag="Available" />
        </View>
      </View>
    </>
  );
}

function DiscoverPreview() {
  const people = [
    { initials: "MK", name: "Maya Kim", distance: "1.2 miles away", hobbies: ["Photography", "Coffee walks"], tint: ["#17351F", "#0C1911"] as const },
    { initials: "JL", name: "Jordan Lee", distance: "2.8 miles away", hobbies: ["Hiking", "Climbing"], tint: ["#26341A", "#11190D"] as const },
    { initials: "AR", name: "Avery Reed", distance: "4.1 miles away", hobbies: ["Board games", "Cooking"], tint: ["#12302A", "#091714"] as const },
  ];

  return (
    <>
      <SectionHeader eyebrow="NEARBY THIS WEEK" title="Good company starts nearby." copy="A sample of the people and shared interests recruiters can explore in the full experience." />
      <View style={styles.peopleGrid}>
        {people.map((person) => (
          <LinearGradient key={person.name} colors={person.tint} style={styles.personCard}>
            <View style={styles.personTop}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{person.initials}</Text></View>
              <View style={styles.personMeta}>
                <Text style={styles.personName}>{person.name}</Text>
                <Text style={styles.distance}>{person.distance}</Text>
              </View>
              <Ionicons name="location-outline" size={20} color={colors.brandDark} />
            </View>
            <Text style={styles.personBio}>Looking for relaxed plans, new favorite places, and people who enjoy the same things.</Text>
            <View style={styles.chipRow}>
              {person.hobbies.map((hobby) => <Text key={hobby} style={styles.chip}>{hobby}</Text>)}
            </View>
            <View style={styles.previewAction}>
              <Ionicons name="sparkles-outline" size={17} color={colors.brandDark} />
              <Text style={styles.previewActionText}>Preview connection</Text>
            </View>
          </LinearGradient>
        ))}
      </View>
    </>
  );
}

function MeetupsPreview() {
  return (
    <>
      <SectionHeader eyebrow="PLANS IN MOTION" title="From shared interest to actual plan." copy="Requests keep the activity, time, and conversation together without the group-chat chaos." />
      <View style={styles.statsRow}>
        <Stat value="2" label="Upcoming" />
        <Stat value="1" label="Waiting" />
        <Stat value="4" label="Completed" />
      </View>
      <View style={styles.card}>
        <PreviewRow icon="camera-outline" title="Golden-hour photo walk" meta="With Maya · Friday at 6:30 PM" tag="Accepted" />
        <PreviewRow icon="trail-sign-outline" title="Riverside trail loop" meta="With Jordan · Saturday at 9:00 AM" tag="Accepted" />
        <PreviewRow icon="game-controller-outline" title="Board-game café" meta="With Avery · Sunday at 3:00 PM" tag="Pending" />
      </View>
    </>
  );
}

function ProfilePreview() {
  return (
    <>
      <SectionHeader eyebrow="YOUR CORNER" title="A profile built around doing." copy="Interests, availability, and moments from the hobbies that make a person worth meeting." />
      <LinearGradient colors={["#123A20", "#07140C", "#0C2114"]} style={styles.profileCard}>
        <View style={styles.profileHero}>
          <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>AM</Text></View>
          <View style={styles.profileIdentity}>
            <Text style={styles.profileName}>Alex Morgan</Text>
            <Text style={styles.profileLocation}>Portland · Guest profile preview</Text>
          </View>
        </View>
        <Text style={styles.profileBio}>Usually outside with a camera, trying a new trail, or finding the neighborhood's best coffee.</Text>
        <View style={styles.chipRow}>
          {['Photography', 'Hiking', 'Coffee', 'Live music'].map((hobby) => <Text key={hobby} style={styles.chip}>{hobby}</Text>)}
        </View>
        <View style={styles.profileStats}>
          <Stat value="8" label="Connections" />
          <Stat value="6" label="Meetups" />
          <Stat value="3" label="Posts" />
        </View>
        <View style={styles.postGrid}>
          <LinearGradient colors={["#355C37", "#101E13"]} style={styles.post}><Ionicons name="leaf-outline" size={30} color={colors.accent} /><Text style={styles.postText}>Forest loop</Text></LinearGradient>
          <LinearGradient colors={["#394C25", "#141B0D"]} style={styles.post}><Ionicons name="camera-outline" size={30} color={colors.accent} /><Text style={styles.postText}>Photo walk</Text></LinearGradient>
          <LinearGradient colors={["#1D4938", "#0A1913"]} style={styles.post}><Ionicons name="cafe-outline" size={30} color={colors.accent} /><Text style={styles.postText}>Coffee find</Text></LinearGradient>
        </View>
      </LinearGradient>
    </>
  );
}

function PreviewRow({ icon, title, meta, tag }: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; meta: string; tag: string }) {
  return (
    <View style={styles.previewRow}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={20} color={colors.brandDark} /></View>
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowMeta}>{meta}</Text></View>
      <Text style={styles.rowTag}>{tag}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "transparent" },
  page: { width: "100%", maxWidth: 980, alignSelf: "center", padding: 22, paddingBottom: 40 },
  previewBanner: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(12,21,16,0.92)", borderRadius: radius.lg, padding: 13, marginBottom: 26 },
  previewIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  previewCopy: { flex: 1 },
  previewTitle: { color: colors.ink, fontWeight: "900", fontSize: 13 },
  previewText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  exitButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 8 },
  exitText: { color: colors.brandDark, fontSize: 11, fontWeight: "900" },
  sectionHeader: { marginBottom: 18 },
  eyebrow: { color: colors.brandDark, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: "900", marginTop: 7 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, maxWidth: 690, marginTop: 7 },
  card: { backgroundColor: "rgba(12,21,16,0.94)", borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 17, ...(shadow as object) },
  weekRow: { flexDirection: "row", gap: 7, marginBottom: 20 },
  day: { flex: 1, minWidth: 38, alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 10, backgroundColor: colors.surfaceMuted },
  dayActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  dayName: { color: colors.subtle, fontSize: 9, fontWeight: "900" },
  dayNameActive: { color: colors.brandDark },
  dayDate: { color: colors.ink, fontSize: 18, fontWeight: "900", marginTop: 4 },
  dayDateActive: { color: colors.brandDark },
  availabilityDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: 6 },
  availabilityDotActive: { backgroundColor: colors.accent },
  slotList: { gap: 9 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 13, backgroundColor: colors.surfaceMuted },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  rowMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  rowTag: { color: colors.brandDark, fontSize: 10, fontWeight: "900", backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  peopleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  personCard: { flexGrow: 1, flexBasis: 270, maxWidth: 470, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 17, ...(shadow as object) },
  personTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand },
  avatarText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  personMeta: { flex: 1 },
  personName: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  distance: { color: colors.brandDark, fontSize: 11, fontWeight: "700", marginTop: 3 },
  personBio: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 13 },
  chip: { color: colors.brandDark, fontSize: 10, fontWeight: "800", backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6, overflow: "hidden" },
  previewAction: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: colors.brand, borderRadius: radius.sm, marginTop: 15 },
  previewActionText: { color: colors.brandDark, fontSize: 11, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  stat: { flex: 1, minWidth: 90, alignItems: "center", backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 8 },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 3 },
  profileCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 20, ...(shadow as object) },
  profileHero: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileAvatar: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand, borderWidth: 3, borderColor: colors.brandDark },
  profileAvatarText: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  profileIdentity: { flex: 1 },
  profileName: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  profileLocation: { color: colors.muted, fontSize: 12, marginTop: 4 },
  profileBio: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 17, maxWidth: 650 },
  profileStats: { flexDirection: "row", gap: 9, marginTop: 18 },
  postGrid: { flexDirection: "row", gap: 9, marginTop: 18 },
  post: { flex: 1, aspectRatio: 1, maxHeight: 180, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  postText: { color: colors.ink, fontSize: 10, fontWeight: "900", marginTop: 8 },
});
