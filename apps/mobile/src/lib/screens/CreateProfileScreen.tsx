import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
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

  const pickImage = async (setFn: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access.");
      return;
    }

const res = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ["images"],
  allowsEditing: true,
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
    <ScrollView style={{ flex: 1, padding: 18, backgroundColor: "#ffffff" }}>
      <Text style={{ fontSize: 26, fontWeight: "900", marginBottom: 10 }}>
        Create Profile
      </Text>

      <TouchableOpacity onPress={() => pickImage(setCoverImage)}>
        <Text>Pick Cover Image</Text>
      </TouchableOpacity>

      {coverImage && (
        <Image
          source={{ uri: coverImage }}
          style={{ width: "100%", height: 135, marginBottom: 8 }}
        />
      )}

      <TouchableOpacity onPress={() => pickImage(setProfileImage)}>
        <Text>Pick Profile Image</Text>
      </TouchableOpacity>

      {profileImage && (
        <Image
          source={{ uri: profileImage }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            marginTop: 8,
            marginBottom: 14,
          }}
        />
      )}

      <TextInput
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
        style={{
          borderWidth: 1,
          borderColor: "#111",
          padding: 12,
          marginTop: 10,
          marginBottom: 20,
        }}
      />

      <Text style={{ marginBottom: 8, fontWeight: "700" }}>
        Select at least 5 hobbies
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}>
        {HOBBIES.map((hobby) => {
          const selected = selectedHobbies.includes(hobby);

          return (
            <TouchableOpacity
              key={hobby}
              onPress={() => toggleHobby(hobby)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginRight: 8,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#111",
                backgroundColor: selected ? "#0057ff" : "#ffffff",
              }}
            >
              <Text style={{ color: selected ? "#ffffff" : "#000000" }}>
                {hobby}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{
          backgroundColor: saving ? "#555555" : "#000000",
          padding: 16,
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={{ color: "#ffffff", fontWeight: "800" }}>Save</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}