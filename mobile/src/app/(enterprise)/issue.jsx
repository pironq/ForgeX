import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PlusCircle,
  QrCode,
  CheckCircle2,
  User,
  Briefcase,
  Star,
  Info,
  Link as LinkIcon,
  Shield,
  Lock,
} from "lucide-react-native";
import { signCredential } from "@/utils/crypto";
import { issueCredentialOnChain, getExplorerUrl, CONTRACT_ADDRESS } from "@/utils/blockchain";
import useStore from "@/store/useStore";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

const CredentialQR = ({ value }) => (
  <View style={styles.qrPlaceholder}>
    <QRCode value={value} size={200} backgroundColor="#f8fafc" />
  </View>
);

export default function IssueCredentialScreen() {
  const insets = useSafeAreaInsets();
  const { did, addIssuedCredential, isEnterpriseVerified, enterpriseVerificationLoading } = useStore();
  const [formData, setFormData] = useState({
    workerDid: "",
    platform: "",
    rating: "",
    deliveries: "",
    years: "",
  });
  const [issuedToken, setIssuedToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [onChainResult, setOnChainResult] = useState(null);

  const isContractDeployed = CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  const handleIssue = async () => {
    if (!formData.workerDid || !formData.platform || !formData.rating) {
      Alert.alert("Missing Info", "Please fill in the required fields.");
      return;
    }

    if (!did) {
      Alert.alert(
        "Error",
        "Your wallet is not initialized. Please restart the app.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const claims = {
        platform: formData.platform,
        rating: parseFloat(formData.rating),
        deliveries: parseInt(formData.deliveries) || 0,
        years: parseFloat(formData.years) || 0,
        type: "WorkRating",
      };

      // Sign credential off-chain (for QR sharing)
      const token = await signCredential(did, formData.workerDid, claims);

      // Try to issue on-chain if contract is deployed
      let chainResult = null;
      if (isContractDeployed) {
        chainResult = await issueCredentialOnChain(claims, formData.workerDid, formData.platform);
        setOnChainResult(chainResult);
      }

      setIssuedToken(token);
      addIssuedCredential({
        token,
        claims,
        workerDid: formData.workerDid,
        iat: Math.floor(Date.now() / 1000),
        onChain: chainResult?.success || false,
        txHash: chainResult?.txHash || null,
        credentialHash: chainResult?.hash || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error issuing credential:", error);
      Alert.alert("Error", "Failed to issue credential. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (enterpriseVerificationLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!isEnterpriseVerified) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center", padding: 32 }]}>
        <Lock size={48} color="#94a3b8" />
        <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: "#1e293b", marginTop: 20, marginBottom: 8 }}>
          Issuing Locked
        </Text>
        <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748b", textAlign: "center", lineHeight: 22 }}>
          Your enterprise must be verified before you can issue credentials. Contact support@credchain.app
        </Text>
      </View>
    );
  }

  if (issuedToken) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Credential Issued!</Text>
          <Text style={styles.subtitle}>
            Ask the worker to scan this code to receive their credential.
          </Text>
        </View>

        <View style={styles.qrContainer}>
          <CredentialQR value={issuedToken} />

          {/* On-chain status */}
          {onChainResult && (
            <View style={styles.onChainStatus}>
              {onChainResult.success ? (
                <>
                  <View style={styles.onChainBadge}>
                    <Shield size={16} color="#16a34a" />
                    <Text style={styles.onChainBadgeText}>Verified On-Chain</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewTxButton}
                    onPress={() => Linking.openURL(getExplorerUrl(onChainResult.txHash))}
                  >
                    <LinkIcon size={14} color="#2563eb" />
                    <Text style={styles.viewTxText}>View on Polygon</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.offChainBadge}>
                  <Text style={styles.offChainText}>Off-chain only (no gas)</Text>
                </View>
              )}
            </View>
          )}

          {!isContractDeployed && (
            <View style={styles.offChainBadge}>
              <Text style={styles.offChainText}>Off-chain (contract not deployed)</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              setIssuedToken(null);
              setOnChainResult(null);
              setFormData({
                workerDid: "",
                platform: "",
                rating: "",
                deliveries: "",
                years: "",
              });
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Issue Credential</Text>
          <Text style={styles.subtitle}>
            Create a verifiable work record for a worker
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Worker's Wallet Address *</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="did:key:..."
                value={formData.workerDid}
                onChangeText={(val) =>
                  setFormData({ ...formData, workerDid: val })
                }
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Platform / Company *</Text>
            <View style={styles.inputWrapper}>
              <Briefcase size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Uber, Swiggy, Upwork"
                value={formData.platform}
                onChangeText={(val) =>
                  setFormData({ ...formData, platform: val })
                }
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Rating (0-5) *</Text>
              <View style={styles.inputWrapper}>
                <Star size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="4.8"
                  keyboardType="numeric"
                  value={formData.rating}
                  onChangeText={(val) =>
                    setFormData({ ...formData, rating: val })
                  }
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Total Deliveries</Text>
              <View style={styles.inputWrapper}>
                <PlusCircle size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="1200"
                  keyboardType="numeric"
                  value={formData.deliveries}
                  onChangeText={(val) =>
                    setFormData({ ...formData, deliveries: val })
                  }
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years on Platform</Text>
            <View style={styles.inputWrapper}>
              <Info size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="2"
                keyboardType="numeric"
                value={formData.years}
                onChangeText={(val) => setFormData({ ...formData, years: val })}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.issueButton, isLoading && styles.issueButtonDisabled]}
            onPress={handleIssue}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.issueButtonText}>Issuing...</Text>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} color="#ffffff" />
                <Text style={styles.issueButtonText}>Sign & Issue Credential</Text>
              </>
            )}
          </TouchableOpacity>

          {isContractDeployed && (
            <View style={styles.onChainNote}>
              <Shield size={14} color="#16a34a" />
              <Text style={styles.onChainNoteText}>Will be recorded on Polygon blockchain</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingAnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 52,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  issueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    height: 56,
    borderRadius: 16,
    gap: 8,
    marginTop: 12,
  },
  issueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  qrContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  qrPlaceholder: {
    backgroundColor: "#f8fafc",
    padding: 32,
    borderRadius: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 40,
  },
  qrValue: {
    marginTop: 16,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    width: 200,
    textAlign: "center",
  },
  doneButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  issueButtonDisabled: {
    opacity: 0.7,
  },
  onChainStatus: {
    alignItems: "center",
    marginBottom: 24,
  },
  onChainBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  onChainBadgeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#16a34a",
  },
  offChainBadge: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  offChainText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  viewTxButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewTxText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#2563eb",
  },
  onChainNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  onChainNoteText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#16a34a",
  },
});
