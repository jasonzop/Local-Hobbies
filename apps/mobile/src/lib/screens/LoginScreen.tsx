import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { loginUser, registerUser, saveSession } from "../api";
import { colors, radius, shadow } from "../theme";

const logo = require("../../../assets/logo.png");

export default function LoginScreen({
  onLoginSuccess,
}: {
  onLoginSuccess: (isNewUser?: boolean) => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (isRegister && cleanName.length < 2) {
      setError("Please enter the name you want people to see.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const response = isRegister
        ? await registerUser({ name: cleanName, email: cleanEmail, password })
        : await loginUser({ email: cleanEmail, password });
      const userData = response.user || response;

      if (!userData?.id) throw new Error("The server did not return a valid user.");

      await saveSession(userData.id, response.token);
      onLoginSuccess(isRegister);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setError("");
    setIsRegister((current) => !current);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.layout, wide && styles.layoutWide]}>
          <View style={[styles.intro, wide && styles.introWide]}>
            <Image source={logo} resizeMode="contain" style={styles.logo} />
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>MEET LOCAL. DO MORE.</Text>
            </View>
            <Text style={[styles.hero, !wide && styles.heroCompact]}>
              Find your people through the things you already love.
            </Text>
            <Text style={styles.introCopy}>
              Make a plan, discover nearby hobby partners, and turn a free afternoon into something memorable.
            </Text>

            {wide && (
              <View style={styles.featureRow}>
                <Feature icon="location-outline" label="Nearby people" />
                <Feature icon="calendar-outline" label="Shared availability" />
                <Feature icon="chatbubbles-outline" label="Easy planning" />
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardKicker}>{isRegister ? "JOIN THE COMMUNITY" : "WELCOME BACK"}</Text>
            <Text style={styles.cardTitle}>{isRegister ? "Create your account" : "Pick up where you left off"}</Text>
            <Text style={styles.cardCopy}>
              {isRegister ? "A few details now, then you can build your profile." : "Sign in to see your plans and connections."}
            </Text>

            {isRegister && (
              <Field
                icon="person-outline"
                label="Name"
                value={name}
                placeholder="How should people know you?"
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <Field
              icon="mail-outline"
              label="Email"
              value={email}
              placeholder="you@example.com"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrap, !!error && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={19} color={colors.muted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.subtle}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onSubmitEditing={handleSubmit}
                  style={styles.input}
                />
                <Pressable
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  onPress={() => setShowPassword((current) => !current)}
                  hitSlop={8}
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              disabled={submitting}
              onPress={handleSubmit}
              style={({ pressed }) => [styles.primaryButton, (pressed || submitting) && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Just a moment…" : isRegister ? "Create account" : "Sign in"}
              </Text>
              {!submitting && <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchCopy}>{isRegister ? "Already have an account?" : "New to Local Hobbies?"}</Text>
              <Pressable onPress={switchMode}>
                <Text style={styles.switchLink}>{isRegister ? "Sign in" : "Create one"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  icon,
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={19} color={colors.muted} />
        <TextInput {...props} placeholderTextColor={colors.subtle} style={styles.input} />
      </View>
    </View>
  );
}

function Feature({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={19} color={colors.brandDark} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 22 },
  layout: { width: "100%", maxWidth: 1100, alignSelf: "center", gap: 30 },
  layoutWide: { flexDirection: "row", alignItems: "center", gap: 64 },
  intro: { flex: 1, alignItems: "center" },
  introWide: { alignItems: "flex-start" },
  logo: { width: 116, height: 116, marginBottom: 16 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  eyebrow: { color: colors.brand, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  hero: { marginTop: 16, color: colors.ink, fontSize: 46, lineHeight: 52, fontWeight: "900", maxWidth: 560 },
  heroCompact: { fontSize: 34, lineHeight: 40, textAlign: "center" },
  introCopy: { marginTop: 16, color: colors.muted, fontSize: 17, lineHeight: 26, maxWidth: 540 },
  featureRow: { marginTop: 26, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  feature: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 13 },
  featureText: { color: colors.brandDark, fontSize: 13, fontWeight: "700" },
  card: { flex: 1, width: "100%", maxWidth: 460, alignSelf: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 28, ...(shadow as object) },
  cardKicker: { color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  cardTitle: { marginTop: 8, color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "900" },
  cardCopy: { marginTop: 8, marginBottom: 22, color: colors.muted, lineHeight: 21 },
  fieldGroup: { marginBottom: 15 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800", marginBottom: 7 },
  inputWrap: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: "#FBFCFA", paddingHorizontal: 14 },
  inputWrapError: {},
  input: { flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 13, outlineStyle: "none" } as any,
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 11, marginBottom: 14 },
  errorText: { flex: 1, color: colors.danger, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  primaryButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: 18 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  buttonPressed: { opacity: 0.72 },
  switchRow: { marginTop: 18, flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 5 },
  switchCopy: { color: colors.muted, fontSize: 13 },
  switchLink: { color: colors.brand, fontSize: 13, fontWeight: "900" },
});
