import React, { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginUser, registerUser, saveSession } from "../api";

const logo = require("../../../assets/logo.png");

type Props = {
  onLoginSuccess: (isNewUser?: boolean) => void;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      let response;

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

      const userData = response.user || response;

      if (!userData?.id) {
        throw new Error("No valid user returned from backend");
      }

      await saveSession(userData.id, response.token);

      console.log("SAVED SESSION USER ID:", userData.id);

      onLoginSuccess(isRegister);
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
        backgroundColor: "#006c1d",
      }}
    >
      <Image
        source={logo}
        resizeMode="contain"
        style={{
          width: 180,
          height: 180,
          alignSelf: "center",
          marginBottom: 8,
        }}
      />

      <Text
        style={{
          fontSize: 72,
          fontWeight: "800",
          marginBottom: 10,
          textAlign: "center",
          color: "#111111",
          fontFamily: "Geshina",
        }}
      >
        LOCAL HOBBIES
      </Text>

      <Text
        style={{
          fontSize: 40,
          fontWeight: "700",
          marginBottom: 20,
          textAlign: "center",
          fontFamily: "Geshina",
        }}
      >
        {isRegister ? "Create an Account" : "LOGIN"}
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
        autoCorrect={false}
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