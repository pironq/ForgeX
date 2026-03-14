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
  Modal,
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
  Fuel,
  X,
} from "lucide-react-native";
import { signCredential } from "@/utils/crypto";
import { issueCredentialOnChain, estimateIssueGas, getExplorerUrl, CONTRACT_ADDRESS, CHAIN_CONFIG } from "@/utils/blockchain";
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
  const { did, addIssuedCredential, isEnterpriseVerified, enterpriseVerificationLoading, fetchBalance } = useStore();
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
  const [gasModal, setGasModal] = useState({ visible: false, estimates: null, loading: false });

  const isContractDeployed = CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  const buildClaims = () => ({
    platform: formData.platform,
    rating: parseFloat(formData.rating),
    deliveries: parseInt(formData.deliveries) || 0,
    years: parseFloat(formData.years) || 0,
    type: "WorkRating",
  });

  const handleIssue = async () => {
    if (!formData.workerDid || !formData.platform || !formData.rating) {
      Alert.alert("Missing Info", "Please fill in the required fields.");
      return;
    }
    if (!did) {
      Alert.alert("Error", "Your wallet is not initialized. Please restart the app.");
      return;
    }

    if (isContractDeployed) {
      // Show gas approval modal first
      setGasModal({ visible: true, estimates: null, loading: true });
      const estimates = await estimateIssueGas(buildClaims(), formData.workerDid, formData.platform);
      setGasModal({ visible: true, estimates, loading: false });
    } else {
      // No contract — issue off-chain directly
      await executeIssue(false);
    }
  };

  const executeIssue = async (onChain) => {
    setGasModal({ visible: false, estimates: null, loading: false });
    setIsLoading(true);

    try {
      const claims = buildClaims();
      const token = await signCredential(did, formData.workerDid, claims);

      // Show QR immediately with off-chain token
      setIssuedToken(token);
      setIsLoading(false);

      const credentialEntry = {
        token,
        claims,
        workerDid: formData.workerDid,
        iat: Math.floor(Date.now() / 1000),
        onChain: false,
        txHash: null,
        credentialHash: null,
      };

      // Try on-chain in background — don't block the QR
      if (onChain && isContractDeployed) {
        setOnChainResult({ pending: true });
        issueCredentialOnChain(claims, formData.workerDid, formData.platform)
          .then((chainResult) => {
            setOnChainResult(chainResult);
            if (chainResult.success) {
              credentialEntry.onChain = true;
              credentialEntry.txHash = chainResult.txHash;
              credentialEntry.credentialHash = chainResult.hash;
              fetchBalance();
            }
            addIssuedCredential(credentialEntry);
          })
          .catch(() => {
            setOnChainResult({ success: false, error: "Network error" });
            addIssuedCredential(credentialEntry);
          });
      } else {
        addIssuedCredential(credentialEntry);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error issuing credential:", error);
      Alert.alert("Error", "Failed to issue credential. Please try again.");
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
              {onChainResult.pending ? (
                <View style={styles.onChainBadge}>
                  <ActivityIndicator size="small" color="#f59e0b" />
                  <Text style={[styles.onChainBadgeText, { color: "#f59e0b" }]}>Recording on-chain...</Text>
                </View>
              ) : onChainResult.success ? (
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

      {/* Gas Approval Modal */}
      <Modal
        visible={gasModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setGasModal({ visible: false, estimates: null, loading: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Fuel size={20} color="#f59e0b" />
                <Text style={styles.modalTitle}>Confirm Transaction</Text>
              </View>
              <TouchableOpacity onPress={() => setGasModal({ visible: false, estimates: null, loading: false })}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {gasModal.loading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.modalLoadingText}>Estimating gas fees...</Text>
              </View>
            ) : gasModal.estimates ? (
              <>
                <View style={styles.gasDetails}>
                  <View style={styles.gasRow}>
                    <Text style={styles.gasLabel}>Network</Text>
                    <Text style={styles.gasValue}>{CHAIN_CONFIG.chainName}</Text>
                  </View>
                  <View style={styles.gasRow}>
                    <Text style={styles.gasLabel}>Gas Limit</Text>
                    <Text style={styles.gasValue}>{gasModal.estimates.gasLimit}</Text>
                  </View>
                  <View style={styles.gasRow}>
                    <Text style={styles.gasLabel}>Gas Price</Text>
                    <Text style={styles.gasValue}>{gasModal.estimates.gasPrice} Gwei</Text>
                  </View>
                  <View style={styles.gasDivider} />
                  <View style={styles.gasRow}>
                    <Text style={styles.gasTotalLabel}>Estimated Fee</Text>
                    <Text style={styles.gasTotalValue}>{parseFloat(gasModal.estimates.totalCostPOL).toFixed(6)} POL</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => {
                      setGasModal({ visible: false, estimates: null, loading: false });
                      // Issue off-chain only
                      executeIssue(false);
                    }}
                  >
                    <Text style={styles.rejectButtonText}>Off-Chain Only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => executeIssue(true)}
                  >
                    <Text style={styles.approveButtonText}>Approve & Sign</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  modalLoading: {
    alignItems: "center",
    paddingVertical: 32,
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  gasDetails: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  gasRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  gasLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  gasValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
  },
  gasDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 4,
  },
  gasTotalLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  gasTotalValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#16a34a",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  rejectButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  approveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#16a34a",
    alignItems: "center",
  },
  approveButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
});
