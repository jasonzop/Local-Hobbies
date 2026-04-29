import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { View, Text, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser, registerUser } from "../api";

type Props = {
  onLoginSuccess: () => void;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      let response: any;

      if (isRegister) {
        response = await registerUser({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
        });
      } else {
        response = await loginUser({
          email: email.trim(),
          password: password.trim(),
        });
      }

      console.log("AUTH RESPONSE:", response);

      // 🔥 FIX: handle BOTH response formats
      const userData = response.user || response;

      if (!userData?.email) {
        throw new Error("No valid user returned from backend");
      }

    const userToStore = {
  id: userData.id,
  name: userData.name,
  email: userData.email,
  bio: userData.bio,
  profileImageUrl: userData.profileImageUrl,
};

      await AsyncStorage.setItem("user", JSON.stringify(userToStore));

      console.log("SAVED USER:", userToStore);

      onLoginSuccess();
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.message || "Something went wrong");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#ffffff",
      }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: "800",
          marginBottom: 20,
          textAlign: "center",
          color: "#111111",
        }}
      >
        Local Hobbies
      </Text>

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        {isRegister ? "Create an Account" : "Welcome Back"}
      </Text>

      {isRegister && (
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            backgroundColor: "white",
          }}
        />
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          backgroundColor: "white",
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          backgroundColor: "white",
        }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: "#007AFF",
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>
          {isRegister ? "Register" : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsRegister(!isRegister)}
        style={{
          backgroundColor: "#111111",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          {isRegister ? "Switch to Login" : "Switch to Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}