import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { generateMnemonic, deriveWallet } from "@/utils/crypto";
import useStore from "@/store/useStore";


export default function CreateWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initializeWallet = useStore((state) => state.initializeWallet);
  const [mnemonic, setMnemonic] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Generate mnemonic async to not block UI
    const generate = async () => {
      setIsGenerating(true);
      // Small delay to let loading UI render
      await new Promise(resolve => setTimeout(resolve, 100));
      const phrase = generateMnemonic();
      setMnemonic(phrase);
      setIsGenerating(false);
    };
    generate();
  }, []);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Copied",
      "Recovery phrase copied to clipboard. Store it safely!",
    );
  };

  const handleContinue = async () => {
    if (!confirmed) {
      Alert.alert(
        "Confirmation Required",
        "Please confirm that you have saved your recovery phrase.",
      );
      return;
    }
    setIsInitializing(true);
    // Small delay so loading spinner renders before heavy crypto
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const { address, privateKey } = deriveWallet(mnemonic);
      await initializeWallet(mnemonic, address, privateKey);
      router.push("/onboarding/wallet-ready");
    } finally {
      setIsInitializing(false);
    }
  };

  const words = mnemonic.split(" ");

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Wallet</Text>
          <Text style={styles.subtitle}>
            Your work identity starts with a secure cryptographic wallet.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <AlertTriangle size={24} color="#b45309" />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Security Warning</Text>
            <Text style={styles.warningDescription}>
              Write down these 12 words and keep them safe. Anyone with this
              phrase can access your identity. You cannot recover your wallet
              without it.
            </Text>
          </View>
        </View>

        <View style={styles.phraseContainer}>
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Generating secure wallet...</Text>
            </View>
          ) : (
            <>
              <View style={styles.phraseGrid}>
                {words.map((word, index) => (
                  <View key={index} style={styles.wordBox}>
                    <Text style={styles.wordIndex}>{index + 1}</Text>
                    <Text style={styles.wordText}>{word}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                <Copy size={20} color="#2563eb" />
                <Text style={styles.copyButtonText}>Copy Phrase</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setConfirmed(!confirmed)}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
            {confirmed && <CheckCircle2 size={18} color="#ffffff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I have written down and saved my recovery phrase
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!confirmed || isGenerating || isInitializing) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!confirmed || isGenerating || isInitializing}
        >
          {isInitializing ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.buttonText}>  Creating Wallet...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
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
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fef3c7",
    marginBottom: 24,
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#92400e",
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#b45309",
    lineHeight: 18,
  },
  phraseContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 24,
  },
  phraseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  wordBox: {
    width: "31%",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 4,
  },
  wordIndex: {
    fontSize: 10,
    color: "#94a3b8",
    marginRight: 6,
    width: 14,
  },
  wordText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 8,
  },
  copyButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#2563eb",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#475569",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
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
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
});
