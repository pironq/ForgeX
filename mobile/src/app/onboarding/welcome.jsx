import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck } from "lucide-react-native";


export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <ShieldCheck size={80} color="#2563eb" />
          <Text style={styles.appName}>CredChain</Text>
        </View>

        <View style={styles.textSection}>
          <Text style={styles.tagline}>Own Your Work Identity</Text>
          <Text style={styles.description}>
            The decentralized way to store and share your verified work
            credentials. Secure, private, and entirely in your control.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/onboarding/role-selection")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginTop: 16,
  },
  textSection: {
    alignItems: "center",
  },
  tagline: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
});
