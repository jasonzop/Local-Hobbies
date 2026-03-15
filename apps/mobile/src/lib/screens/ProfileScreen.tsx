import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

type User = {
  id?: number;
  name?: string;
  email?: string;
};

type Post = {
  id: string;
  imageUri: string;
  caption: string;
  createdAt: string;
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);

  const [editedBio, setEditedBio] = useState("");
  const [selectedPostImage, setSelectedPostImage] = useState<string | null>(null);
  const [newPostCaption, setNewPostCaption] = useState("");

  useEffect(() => {
    loadUserAndProfile();
  }, []);

  const userKey = useMemo(() => {
    if (!user) return "guest";
    return user.email || String(user.id) || "guest";
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserProfileData();
    }
  }, [user, userKey]);

  const getProfileImageKey = () => `profileImage_${userKey}`;
  const getBioKey = () => `bio_${userKey}`;
  const getPostsKey = () => `posts_${userKey}`;

  const loadUserAndProfile = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");

      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.log("Error loading user:", error);
    }
  };

  const loadUserProfileData = async () => {
    try {
      const [storedProfileImage, storedBio, storedPosts] = await Promise.all([
        AsyncStorage.getItem(getProfileImageKey()),
        AsyncStorage.getItem(getBioKey()),
        AsyncStorage.getItem(getPostsKey()),
      ]);

      setProfileImage(storedProfileImage || null);
      setBio(storedBio || "");

      if (storedPosts) {
        setPosts(JSON.parse(storedPosts));
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.log("Error loading profile data:", error);
    }
  };

  const pickProfileImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission needed", "Please allow photo access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem(getProfileImageKey(), imageUri);
      }
    } catch (error) {
      console.log("Error picking profile image:", error);
    }
  };

  const openEditProfileModal = () => {
    setEditedBio(bio);
    setEditProfileModalVisible(true);
  };

  const saveProfileChanges = async () => {
    try {
      setBio(editedBio);
      await AsyncStorage.setItem(getBioKey(), editedBio);
      setEditProfileModalVisible(false);
    } catch (error) {
      console.log("Error saving profile:", error);
      Alert.alert("Error", "Could not save profile changes.");
    }
  };

  const pickPostImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission needed", "Please allow photo access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedPostImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking post image:", error);
    }
  };

  const openCreatePostModal = () => {
    setSelectedPostImage(null);
    setNewPostCaption("");
    setCreatePostModalVisible(true);
  };

  const saveNewPost = async () => {
    if (!selectedPostImage) {
      Alert.alert("Missing image", "Please choose an image for the post.");
      return;
    }

    try {
      const newPost: Post = {
        id: Date.now().toString(),
        imageUri: selectedPostImage,
        caption: newPostCaption.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      await AsyncStorage.setItem(getPostsKey(), JSON.stringify(updatedPosts));

      setSelectedPostImage(null);
      setNewPostCaption("");
      setCreatePostModalVisible(false);
    } catch (error) {
      console.log("Error saving post:", error);
      Alert.alert("Error", "Could not save post.");
    }
  };

  const deletePost = (postId: string) => {
    Alert.alert("Delete post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const updatedPosts = posts.filter((post) => post.id !== postId);
            setPosts(updatedPosts);
            await AsyncStorage.setItem(
              getPostsKey(),
              JSON.stringify(updatedPosts)
            );
          } catch (error) {
            console.log("Error deleting post:", error);
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUser(null);
      Alert.alert("Logged out");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const displayName = user?.name || "No name found";
  const displayEmail = user?.email || "No email found";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "U";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        <TouchableOpacity onPress={pickProfileImage} activeOpacity={0.8}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={pickProfileImage}>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </TouchableOpacity>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.bioTitle}>Bio</Text>
          <Text style={styles.bioText}>
            {bio.trim().length > 0 ? bio : "Add a short bio here..."}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openEditProfileModal}
          >
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={openCreatePostModal}
          >
            <Text style={styles.secondaryButtonText}>Add Post</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.postsHeaderRow}>
          <Text style={styles.postsTitle}>Posts</Text>
        </View>

        {posts.length === 0 ? (
          <View style={styles.emptyPostsBox}>
            <Text style={styles.emptyPostsText}>No posts yet</Text>
            <Text style={styles.emptyPostsSubtext}>
              Tap "Add Post" to upload your first picture.
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.postRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => deletePost(item.id)}
                style={styles.postCard}
              >
                <Image source={{ uri: item.imageUri }} style={styles.postImage} />
                <Text style={styles.postCaption} numberOfLines={2}>
                  {item.caption || "No caption"}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>

      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              value={editedBio}
              onChangeText={setEditedBio}
              placeholder="Write something about yourself"
              multiline
              style={[styles.input, styles.bioInput]}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveProfileChanges}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={createPostModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreatePostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Post</Text>

            <TouchableOpacity
              style={styles.pickImageButton}
              onPress={pickPostImage}
            >
              <Text style={styles.pickImageButtonText}>Choose Image</Text>
            </TouchableOpacity>

            {selectedPostImage ? (
              <Image
                source={{ uri: selectedPostImage }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewPlaceholderText}>
                  No image selected
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Caption</Text>
            <TextInput
              value={newPostCaption}
              onChangeText={setNewPostCaption}
              placeholder="Write a caption"
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCreatePostModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveNewPost}
              >
                <Text style={styles.modalSaveText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#d9d9d9",
    marginBottom: 10,
  },
  avatarLetter: {
    fontSize: 44,
    fontWeight: "700",
    color: "#333333",
  },
  changePhotoText: {
    textAlign: "center",
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 12,
  },
  name: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
  },
  email: {
    textAlign: "center",
    fontSize: 16,
    color: "#666666",
    marginTop: 4,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ececec",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    color: "#666666",
    marginTop: 4,
  },
  bioContainer: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fafafa",
    marginBottom: 18,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  bioText: {
    fontSize: 15,
    color: "#555555",
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#111111",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#ff4d4f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 24,
  },
  logoutText: {
    color: "#ff4d4f",
    fontWeight: "700",
  },
  postsHeaderRow: {
    marginBottom: 12,
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyPostsBox: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  emptyPostsText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyPostsSubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  postRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  postCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ececec",
  },
  postImage: {
    width: "100%",
    height: 160,
  },
  postCaption: {
    fontSize: 13,
    color: "#333333",
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 42,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: "#ffffff",
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  pickImageButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  pickImageButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 14,
  },
  previewPlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e2e2",
  },
  previewPlaceholderText: {
    color: "#666666",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#333333",
    fontWeight: "700",
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: "#111111",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});