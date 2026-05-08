import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type User = {
  id: number;
  name: string;
  email: string;
  bio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  hobbies?: string[];
  distanceMiles?: number;
};

export type FriendRequest = {
  id: number;
  senderId: number;
  senderName: string;
  senderProfileImageUrl?: string;
  receiverId: number;
  status: string;
};

export type AuthResponse = {
  id?: number;
  name?: string;
  email: string;
  message?: string;
  token?: string;
  user?: User;
};

export type MatchRequest = {
  id: string;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  hobbyId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt?: string;
};

export async function saveSession(userId: number, token?: string) {
  await AsyncStorage.setItem("userId", String(userId));

  if (token) {
    await AsyncStorage.setItem("token", token);
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem("user");
  await AsyncStorage.removeItem("userId");
  await AsyncStorage.removeItem("token");
}

export async function getSavedUserId(): Promise<number | null> {
  const savedUserId = await AsyncStorage.getItem("userId");

  if (!savedUserId) {
    return null;
  }

  const parsed = Number(savedUserId);

  return Number.isFinite(parsed) ? parsed : null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  return (await res.text()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};

function normalizeUser(data: any): User {
  return {
    id: Number(data?.id),
    name: data?.name ?? "",
    email: data?.email ?? "",
    bio: data?.bio ?? "",
    profileImageUrl: data?.profileImageUrl ?? "",
    coverImageUrl: data?.coverImageUrl ?? "",
    hobbies: Array.isArray(data?.hobbies) ? data.hobbies : [],
    distanceMiles: data?.distanceMiles,
  };
}

function normalizeAuthResponse(data: any): AuthResponse {
  if (data?.user) {
    const user = normalizeUser(data.user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token: data.token,
      user,
      message: data.message,
    };
  }

  const user = data ? normalizeUser(data) : undefined;

  return {
    id: user?.id,
    name: user?.name,
    email: user?.email ?? data?.email ?? "",
    token: data?.token,
    message: data?.message,
    user,
  };
}

export async function sendFriendRequest(
  senderId: number,
  receiverId: number
) {
  return api.post<FriendRequest>("/friends/request", {
    senderId,
    receiverId,
  });
}



export async function getIncomingFriendRequests(
  userId: number
) {
  return api.get<FriendRequest[]>(
    `/friends/incoming?userId=${userId}`
  );
}

export async function getOutgoingFriendRequests(userId: number) {
  return api.get<FriendRequest[]>(
    `/friends/outgoing?userId=${userId}`
  );
}

export async function updateFriendRequest(
  requestId: number,
  status: string
) {
  return api.patch<FriendRequest>(
    `/friends/${requestId}`,
    { status }
  );
}

export async function checkFriendRequestExists(
  currentUserId: number,
  otherUserId: number
): Promise<boolean> {
  const response = await api.get<{ exists: boolean }>(
    `/friends/status?currentUserId=${currentUserId}&otherUserId=${otherUserId}`
  );

  return response.exists;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Registration failed");
  }

  const data = await res.json();
  return normalizeAuthResponse(data);
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Login failed");
  }

  const data = await res.json();
  return normalizeAuthResponse(data);
}

export async function getUserById(userId: number): Promise<User> {
  const data = await api.get<User>(`/users/${userId}`);
  return normalizeUser(data);
}

export async function searchUsers(input: {
  query?: string;
  hobby?: string;
  currentUserId?: number;
}): Promise<User[]> {
  const params = new URLSearchParams();

  if (input.query?.trim()) {
    params.append("query", input.query.trim());
  }

  if (input.hobby?.trim()) {
    params.append("hobby", input.hobby.trim());
  }

  if (input.currentUserId) {
    params.append("currentUserId", String(input.currentUserId));
  }

  const data = await api.get<User[]>(`/users/search?${params.toString()}`);
  return Array.isArray(data) ? data.map(normalizeUser) : [];
}

export async function getNearbyUsers(input: {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  currentUserId?: number;
}): Promise<User[]> {
  const params = new URLSearchParams();

  params.append("latitude", String(input.latitude));
  params.append("longitude", String(input.longitude));

  if (input.radiusMiles) {
    params.append("radiusMiles", String(input.radiusMiles));
  }

  if (input.currentUserId) {
    params.append("currentUserId", String(input.currentUserId));
  }

  const data = await api.get<User[]>(`/users/nearby?${params.toString()}`);
  return Array.isArray(data) ? data.map(normalizeUser) : [];
}

export async function getDiscoverUsers(
  userId: number,
  date: string,
  startTime: string,
  endTime: string
): Promise<User[]> {
  const params = new URLSearchParams();

  params.append("userId", String(userId));
  params.append("date", date);
  params.append("startTime", startTime);
  params.append("endTime", endTime);

  const data = await api.get<User[]>(`/users/discover?${params.toString()}`);
  return Array.isArray(data) ? data.map(normalizeUser) : [];
}

export async function sendMatchRequest(input: {
  senderId: number;
  receiverId: number;
  hobbyId: number;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<MatchRequest> {
  return api.post<MatchRequest>("/requests", input);
}

export async function getIncomingRequests(
  userId: number
): Promise<MatchRequest[]> {
  return api.get<MatchRequest[]>(
    `/me/requests?type=incoming&userId=${encodeURIComponent(String(userId))}`
  );
}

export async function getOutgoingRequests(
  userId: number
): Promise<MatchRequest[]> {
  return api.get<MatchRequest[]>(
    `/me/requests?type=outgoing&userId=${encodeURIComponent(String(userId))}`
  );
}

export async function updateMatchRequestStatus(
  requestId: string,
  status: "accepted" | "declined" | "cancelled"
): Promise<MatchRequest> {
  return api.patch<MatchRequest>(`/requests/${requestId}`, { status });
}

export async function updateProfileImage(
  userId: number,
  imageUrl: string
): Promise<User> {
  const data = await api.patch<User>(`/users/${userId}/profile-image`, {
    profileImageUrl: imageUrl,
  });

  return normalizeUser(data);
}

export async function updateProfile(
  userId: number,
  name: string,
  bio: string
): Promise<User> {
  const data = await api.patch<User>(`/users/${userId}/profile`, {
    name,
    bio,
  });

  return normalizeUser(data);
}

export async function uploadImageToCloudinary(uri: string) {
  const data = new FormData();

  const response = await fetch(uri);
  const blob = await response.blob();

  data.append("file", blob, "upload.jpg");

  data.append(
    "upload_preset",
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
  );

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: data,
    }
  );

  const json = await res.json();

  if (!res.ok) {
    console.log("Cloudinary FULL ERROR:", json);
    throw new Error(JSON.stringify(json));
  }

  return json.secure_url;
}

export type BackendPost = {
  id: string;
  userId: number;
  imageUrl: string;
  caption: string;
  createdAt: string;
};

export type Message = {
  id: string;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
};

export async function getPosts(userId: number): Promise<BackendPost[]> {
  return api.get<BackendPost[]>(`/posts?userId=${userId}`);
}

export async function createPost(input: {
  userId: number;
  imageUrl: string;
  caption: string;
}): Promise<BackendPost> {
  return api.post<BackendPost>("/posts", input);
}

export async function deletePostFromBackend(postId: string): Promise<void> {
  return api.delete<void>(`/posts/${postId}`);
}

export async function sendMessage(input: {
  senderId: number;
  receiverId: number;
  content: string;
}): Promise<Message> {
  return api.post<Message>("/messages", input);
}

export async function completeProfileSetup(
  userId: number,
  data: {
    name: string;
    bio: string;
    profileImageUrl?: string | null;
    coverImageUrl?: string | null;
    hobbies: string[];
  }
): Promise<User> {
  const updated = await api.patch<User>(`/users/${userId}/profile-setup`, data);
  return normalizeUser(updated);
}

export async function getMessages(
  user1: number,
  user2: number
): Promise<Message[]> {
  return api.get<Message[]>(
    `/messages?user1=${encodeURIComponent(String(user1))}&user2=${encodeURIComponent(String(user2))}`
  );
}

export async function updateUserLocation(
  userId: number,
  latitude: number,
  longitude: number
): Promise<User> {
  const data = await api.patch<User>(`/users/${userId}/location`, {
    latitude,
    longitude,
  });

  return normalizeUser(data);
}