import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, ChevronRight, Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import useStore from "@/store/useStore";


export default function WalletReadyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { did, role } = useStore();

  const copyDID = async () => {
    await Clipboard.setStringAsync(did);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEnterApp = () => {
    if (role === "worker") {
      router.replace("/(worker)");
    } else {
      router.replace("/(enterprise)");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <CheckCircle2 size={100} color="#16a34a" />
        </View>

        <Text style={styles.title}>Your Wallet is Ready!</Text>
        <Text style={styles.subtitle}>
          You now have a secure, cryptographic identity on CredChain.
        </Text>

        <View style={styles.didCard}>
          <Text style={styles.didLabel}>Your Wallet Address</Text>
          <TouchableOpacity style={styles.didValueContainer} onPress={copyDID}>
            <Text style={styles.didValue} selectable>
              {did}
            </Text>
            <Copy size={16} color="#64748b" style={styles.copyIcon} />
          </TouchableOpacity>
          <Text style={styles.tapToCopy}>Tap to copy</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleEnterApp}>
          <Text style={styles.buttonText}>Enter App</Text>
          <ChevronRight size={20} color="#ffffff" />
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
  successIcon: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  didCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  didLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  didValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  didValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#334155",
    marginRight: 10,
    letterSpacing: 0.5,
  },
  copyIcon: {
    marginLeft: 8,
  },
  tapToCopy: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
  },
  footer: {
    paddingBottom: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
});
