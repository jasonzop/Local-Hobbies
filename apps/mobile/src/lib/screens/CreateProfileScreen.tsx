import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { completeProfileSetup, uploadImageToCloudinary } from "../api";

const HOBBIES = [
  "Tennis",
  "Basketball",
  "Gym",
  "Gaming",
  "Music",
  "Cooking",
  "Photography",
  "Study",
];

export default function CreateProfileScreen({ user, onDone }: any) {
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const pickImage = async (
    setFn: (uri: string) => void,
    aspect: [number, number]
  ) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect,
      quality: 0.35,
    });

    if (!res.canceled) {
      setFn(res.assets[0].uri);
    }
  };

  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter((h) => h !== hobby));
    } else {
      setSelectedHobbies([...selectedHobbies, hobby]);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "User ID missing. Please logout and register again.");
        return;
      }

      if (!bio.trim()) {
        Alert.alert("Missing bio", "Please enter a bio.");
        return;
      }

      if (selectedHobbies.length < 5) {
        Alert.alert("Select hobbies", "Please select at least 5 hobbies.");
        return;
      }

      setSaving(true);

      let profileUrl: string | null = null;
      let coverUrl: string | null = null;

      if (profileImage) {
        profileUrl = await uploadImageToCloudinary(profileImage);
      }

      if (coverImage) {
        coverUrl = await uploadImageToCloudinary(coverImage);
      }

      const updated = await completeProfileSetup(user.id, {
        name: user.name,
        bio: bio.trim(),
        profileImageUrl: profileUrl,
        coverImageUrl: coverUrl,
        hobbies: selectedHobbies,
      });

      onDone(updated);
    } catch (error: any) {
      console.log("Create profile save error:", error);
      Alert.alert("Save failed", error?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>CREATE PROFILE</Text>
          <Text style={styles.subtitle}>
            Finish your profile so people can match with you.
          </Text>

          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => pickImage(setCoverImage, [16, 6])}
              style={styles.coverBox}
            >
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Text style={styles.coverText}>ADD COVER IMAGE</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.avatarSection}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => pickImage(setProfileImage, [1, 1])}
                style={styles.avatarWrap}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.name}>{user?.name || "New User"}</Text>
              <Text style={styles.email}>{user?.email || ""}</Text>
              <Text style={styles.tapText}>Tap images to choose photos</Text>
            </View>

            <Text style={styles.label}>BIO</Text>
            <TextInput
              placeholder="Write a short bio..."
              placeholderTextColor="#d6d6d6"
              value={bio}
              onChangeText={setBio}
              multiline
              style={styles.bioInput}
            />

            <View style={styles.hobbyHeaderRow}>
              <Text style={styles.label}>SELECT 5 HOBBIES</Text>
              <Text style={styles.counter}>{selectedHobbies.length}/5+</Text>
            </View>

            <View style={styles.hobbyGrid}>
              {HOBBIES.map((hobby) => {
                const selected = selectedHobbies.includes(hobby);

                return (
                  <TouchableOpacity
                    key={hobby}
                    onPress={() => toggleHobby(hobby)}
                    style={[
                      styles.hobbyChip,
                      selected && styles.hobbyChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.hobbyChipText,
                        selected && styles.hobbyChipTextSelected,
                      ]}
                    >
                      {hobby}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>SAVE PROFILE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#34692e",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  container: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    color: "#111111",
    marginTop: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#111111",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#000000",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e9e9e9",
    padding: 18,
  },
  coverBox: {
    width: "100%",
    height: 145,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff",
    backgroundColor: "#1f1f1f",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34692e",
  },
  coverText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: -46,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#000000",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: "900",
    color: "#111111",
  },
  name: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  email: {
    color: "#9b9b9b",
    fontSize: 14,
    marginTop: 2,
  },
  tapText: {
    color: "#1877f2",
    fontWeight: "800",
    marginTop: 6,
  },
  label: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
  },
  bioInput: {
    minHeight: 95,
    borderWidth: 1,
    borderColor: "#ffffff",
    backgroundColor: "#34692e",
    borderRadius: 14,
    padding: 14,
    color: "#ffffff",
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  hobbyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counter: {
    color: "#ffffff",
    fontWeight: "900",
    marginBottom: 8,
  },
  hobbyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  hobbyChip: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#ffffff",
    backgroundColor: "#111111",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginRight: "2%",
    marginBottom: 10,
  },
  hobbyChipSelected: {
    backgroundColor: "#1877f2",
  },
  hobbyChipText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  hobbyChipTextSelected: {
    color: "#ffffff",
  },
  saveButton: {
    backgroundColor: "#1877f2",
    borderColor: "#ffffff",
    borderWidth: 2,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#555555",
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },
});