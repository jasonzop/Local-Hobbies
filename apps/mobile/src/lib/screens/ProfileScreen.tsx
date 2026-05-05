import React, { useEffect, useState } from "react";
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
import {
  updateProfile,
  updateProfileImage,
  uploadImageToCloudinary,
  getPosts,
  createPost,
  deletePostFromBackend,
  getUserById,
} from "../api";

type User = {
  id?: number;
  name?: string;
  email?: string;
  bio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  hobbies?: string[];
};

type Post = {
  id: string;
  imageUri: string;
  caption: string;
  createdAt: string;
};

type ProfileScreenProps = {
  user: User | null;
  onLogout: () => void | Promise<void>;
  onUserUpdated?: (user: User) => void;
};

export default function ProfileScreen({
  user: passedUser,
  onUserUpdated,
}: ProfileScreenProps) {
  const [user, setUser] = useState<User | null>(passedUser ?? null);
  const [profileImage, setProfileImage] = useState<string | null>(
    passedUser?.profileImageUrl ?? null
  );
  const [bio, setBio] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);

  const [editedName, setEditedName] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [selectedPostImage, setSelectedPostImage] = useState<string | null>(
    null
  );
  const [newPostCaption, setNewPostCaption] = useState("");
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  useEffect(() => {
    if (passedUser) {
      setUser(passedUser);
      setProfileImage(passedUser.profileImageUrl || null);
      setBio(passedUser.bio || "");
    } else {
      loadUserAndProfile();
    }
  }, [passedUser]);

  useEffect(() => {
    if (user?.id) {
      loadUserProfileData(user.id);
    }
  }, [user?.id]);

  const loadUserAndProfile = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");

      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);

        setUser(parsedUser);
        setProfileImage(parsedUser.profileImageUrl || null);
        setBio(parsedUser.bio || "");
      }
    } catch (error) {
      console.log("Error loading user:", error);
    }
  };

  const loadUserProfileData = async (userId: number) => {
    try {
      const freshUser = await getUserById(userId);

      setUser(freshUser);
      setProfileImage(freshUser.profileImageUrl || null);
      setBio(freshUser.bio || "");

      await AsyncStorage.setItem("user", JSON.stringify(freshUser));
      onUserUpdated?.(freshUser);

      const backendPosts = await getPosts(userId);

      const formattedPosts: Post[] = backendPosts.map((post: any) => ({
        id: String(post.id),
        imageUri: post.imageUrl,
        caption: post.caption || "",
        createdAt: post.createdAt,
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.log("Error loading profile data:", error);
    }
  };

  const pickProfileImage = async () => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "User not found.");
        return;
      }

      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission needed", "Please allow photo access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;

      setUploadingProfileImage(true);
      setProfileImage(imageUri);

      const uploadedUrl = await uploadImageToCloudinary(imageUri);
      const updatedUser = await updateProfileImage(user.id, uploadedUrl);

      const mergedUser: User = {
        ...user,
        ...updatedUser,
        profileImageUrl: uploadedUrl,
      };

      setUser(mergedUser);
      setProfileImage(uploadedUrl);

      await AsyncStorage.setItem("user", JSON.stringify(mergedUser));
      onUserUpdated?.(mergedUser);

      Alert.alert("Success", "Profile picture updated.");
    } catch (error: any) {
      console.log("Error picking profile image:", error);
      Alert.alert("Upload failed", error?.message || "Could not upload image.");
      setProfileImage(user?.profileImageUrl || null);
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const openEditProfileModal = () => {
    setEditedName(user?.name || "");
    setEditedBio(bio);
    setEditProfileModalVisible(true);
  };

  const saveProfileChanges = async () => {
    try {
      const trimmedName = editedName.trim();

      if (!trimmedName) {
        Alert.alert("Missing name", "Please enter your name.");
        return;
      }

      if (!user?.id) {
        Alert.alert("Error", "User not found.");
        return;
      }

      const savedUser = await updateProfile(user.id, trimmedName, editedBio);

      const updatedUser: User = {
        ...user,
        ...savedUser,
        name: savedUser.name || trimmedName,
        bio: savedUser.bio ?? editedBio,
      };

      setUser(updatedUser);
      setBio(updatedUser.bio || "");

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      onUserUpdated?.(updatedUser);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
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

    if (!user?.id) {
      Alert.alert("Error", "User not found.");
      return;
    }

    try {
      const uploadedUrl = await uploadImageToCloudinary(selectedPostImage);

      const savedPost = await createPost({
        userId: user.id,
        imageUrl: uploadedUrl,
        caption: newPostCaption.trim(),
      });

      const newPost: Post = {
        id: String(savedPost.id),
        imageUri: savedPost.imageUrl,
        caption: savedPost.caption || "",
        createdAt: savedPost.createdAt,
      };

      setPosts((prev) => [newPost, ...prev]);

      setSelectedPostImage(null);
      setNewPostCaption("");
      setCreatePostModalVisible(false);
    } catch (error: any) {
      console.log("Error saving post:", error);
      Alert.alert("Error", error?.message || "Could not save post.");
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await deletePostFromBackend(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.log("Error deleting post:", error);
      Alert.alert("Error", "Could not delete post.");
    }
  };

  const displayName = user?.name || "No name found";
  const displayEmail = user?.email || "No email found";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "U";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>PROFILE</Text>

          <View style={styles.headerCard}>
            {user?.coverImageUrl ? (
              <Image
                source={{ uri: user.coverImageUrl }}
                style={styles.coverImage}
              />
            ) : null}

            <View style={styles.profileTop}>
              <View style={styles.avatarWrap}>
                <TouchableOpacity
                  onPress={pickProfileImage}
                  activeOpacity={0.85}
                  disabled={uploadingProfileImage}
                >
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickProfileImage}
                  disabled={uploadingProfileImage}
                >
                  <Text style={styles.changePhotoText}>
                    {uploadingProfileImage ? "Uploading..." : "EDIT"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoWrap}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{displayEmail}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{posts.length}</Text>
                    <Text style={styles.statLabel}>POSTS</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>0</Text>
                    <Text style={styles.statLabel}>FRIENDS</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>
                {bio.trim().length > 0 ? bio : "Add a short bio here..."}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={openEditProfileModal}
              >
                <Text style={styles.primaryButtonText}>EDIT PROFILE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={openCreatePostModal}
              >
                <Text style={styles.secondaryButtonText}>ADD POST</Text>
              </TouchableOpacity>
            </View>
          </View>

          {user?.hobbies && user.hobbies.length > 0 ? (
            <View style={styles.hobbiesCard}>
              <View style={styles.hobbiesRow}>
                {user.hobbies.map((hobby) => (
                  <View key={hobby} style={styles.hobbyWrap}>
                    <View style={styles.hobbyPill}>
                      <Text style={styles.hobbyText}>{hobby}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.postsSection}>
            <View style={styles.postsHeaderRow}>
              <Text style={styles.postsTitle}>POSTS</Text>
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
                numColumns={3}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.postCard,
                      { marginRight: (index + 1) % 3 === 0 ? 0 : 6 },
                    ]}
                  >
                    <Image source={{ uri: item.imageUri }} style={styles.postImage} />

                    <TouchableOpacity
                      onPress={() => deletePost(item.id)}
                      style={styles.deletePostButton}
                    >
                      <Text style={styles.deletePostText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
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

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your name"
              style={styles.input}
            />

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
    backgroundColor: "#34692e",
  },
  scrollContent: {
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 16,
  },
  container: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
    color: "#111111",
  },
  headerCard: {
    backgroundColor: "#000000",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e9e9e9",
    padding: 20,
    marginBottom: 18,
  },
  coverImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
  },
  profileTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  avatarWrap: {
    width: 180,
    alignItems: "center",
    marginRight: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  avatarPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
    borderWidth: 1,
    borderColor: "#dddddd",
  },
  avatarLetter: {
    fontSize: 44,
    fontWeight: "800",
    color: "#333333",
  },
  changePhotoText: {
    marginTop: 10,
    color: "#1877f2",
    fontWeight: "700",
    textAlign: "center",
  },
  infoWrap: {
    flex: 1,
    minWidth: 260,
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    backgroundColor: "#34692e",
    borderWidth: 1,
    borderColor: "#ededed",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginRight: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
  },
  bioContainer: {
    marginTop: 4,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#34692e",
    borderWidth: 1,
    borderColor: "#ededed",
    borderRadius: 14,
  },
  bioText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#010000",
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#1877f2",
    borderColor: "#ffffff",
    borderWidth: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    borderColor: "#ffffff",
    borderWidth: 2,
    backgroundColor: "#111111",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  hobbiesCard: {
    backgroundColor: "#000000",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e9e9e9",
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginBottom: 18,
  },
  hobbiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  hobbyWrap: {
    alignItems: "center",
    marginBottom: 8,
    marginHorizontal: 4,
  },
  hobbyPill: {
    backgroundColor: "#34692e",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  hobbyText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  postsSection: {
    backgroundColor: "#000000",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e9e9e9",
    padding: 18,
  },
  postsHeaderRow: {
    marginBottom: 14,
  },
  postsTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  emptyPostsBox: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 14,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  emptyPostsText: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    color: "#111111",
  },
  emptyPostsSubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  postCard: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 6,
    backgroundColor: "#f2f2f2",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  deletePostButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  deletePostText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
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
    fontWeight: "800",
    marginBottom: 16,
    color: "#111111",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222222",
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
    backgroundColor: "#1877f2",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  pickImageButtonText: {
    color: "#ffffff",
    fontWeight: "800",
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
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  modalCancelText: {
    color: "#333333",
    fontWeight: "800",
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
    fontWeight: "800",
  },
});