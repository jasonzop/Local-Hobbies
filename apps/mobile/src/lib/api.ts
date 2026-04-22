import AsyncStorage from "@react-native-async-storage/async-storage";
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type User = {
  id: number;
  name: string;
  email: string;
  profileImageUrl?: string;
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
  senderId: string;
  senderName?: string;
  receiverId: string;
  receiverName?: string;
  hobbyId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt?: string;
};

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
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
};

function normalizeAuthResponse(data: any): AuthResponse {
  if (data?.user) {
    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      token: data.token,
      user: data.user,
      message: data.message,
    };
  }

  return {
    id: data?.id,
    name: data?.name,
    email: data?.email,
    token: data?.token,
    message: data?.message,
  };
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
  const normalized = normalizeAuthResponse(data);

  if (normalized.token) {
    await AsyncStorage.setItem("token", normalized.token);
  }

  return normalized;
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
  const normalized = normalizeAuthResponse(data);

  if (normalized.token) {
    await AsyncStorage.setItem("token", normalized.token);
  }

  return normalized;
}

export async function getDiscoverUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/users/discover`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to load users");
  }

  return res.json();
}

export async function sendMatchRequest(input: {
  senderId: string;
  receiverId: string;
  hobbyId: number;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<MatchRequest> {
  return api.post<MatchRequest>("/requests", input);
}

export async function getIncomingRequests(
  userId: string
): Promise<MatchRequest[]> {
  return api.get<MatchRequest[]>(
    `/me/requests?type=incoming&userId=${encodeURIComponent(userId)}`
  );
}

export async function getOutgoingRequests(
  userId: string
): Promise<MatchRequest[]> {
  return api.get<MatchRequest[]>(
    `/me/requests?type=outgoing&userId=${encodeURIComponent(userId)}`
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
  return api.patch<User>(`/users/${userId}/profile-image`, {
    profileImageUrl: imageUrl,
  });
}

export async function uploadImageToCloudinary(
  imageUri: string
): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary environment variables are missing");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "profile.jpg",
  } as any);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Cloudinary upload failed");
  }

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary did not return secure_url");
  }

  return data.secure_url as string;
}