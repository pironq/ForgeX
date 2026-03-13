import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Import, AlertCircle } from "lucide-react-native";
import { deriveAddress, derivePrivateKey, isValidMnemonic } from "@/utils/crypto";
import useStore from "@/store/useStore";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function ImportWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initializeWallet = useStore((state) => state.initializeWallet);
  const [phrase, setPhrase] = useState("");

  const handleImport = async () => {
    const trimmed = phrase.trim();
    const words = trimmed.split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      Alert.alert("Invalid Phrase", "Recovery phrase must be 12 or 24 words.");
      return;
    }

    if (!isValidMnemonic(trimmed)) {
      Alert.alert("Invalid Phrase", "This is not a valid BIP-39 recovery phrase. Please check the words and try again.");
      return;
    }

    const address = deriveAddress(trimmed);
    const privateKey = derivePrivateKey(trimmed);
    await initializeWallet(trimmed, address, privateKey);
    router.push("/onboarding/wallet-ready");
  };

  return (
    <KeyboardAvoidingAnimatedView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Import Wallet</Text>
        <Text style={styles.subtitle}>
          Enter your 12 or 24 word recovery phrase to reconstruct your identity.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter words separated by spaces..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={6}
            value={phrase}
            onChangeText={setPhrase}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.infoCard}>
          <AlertCircle size={20} color="#2563eb" />
          <Text style={styles.infoText}>
            Your phrase is processed locally on your device and never sent to
            any server.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !phrase.trim() && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={!phrase.trim()}
        >
          <Text style={styles.buttonText}>Import Wallet</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
    textAlignVertical: "top",
    minHeight: 120,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e40af",
    lineHeight: 20,
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
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
});
