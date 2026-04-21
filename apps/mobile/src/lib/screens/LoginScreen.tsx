import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { View, Text, TextInput, Alert, Pressable } from "react-native";
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
    console.log("BUTTON PRESSED");
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

      const userToStore = {
        id: response.id,
        name: response.name,
        email: response.email,
      };

      if (!userToStore.email) {
        throw new Error("No user returned from backend");
      }

     await AsyncStorage.setItem("user", JSON.stringify(userToStore));

const saved = await AsyncStorage.getItem("user"); // 🔥 FORCE WAIT

console.log("SAVED USER:", saved);

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
  onPress={() => {
    console.log("PRESS WORKED");
    handleSubmit();
  }}
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
  onPress={() => {
    console.log("SWITCH PRESSED");
    setIsRegister(!isRegister);
  }}
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