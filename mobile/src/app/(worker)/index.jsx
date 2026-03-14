import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Shield,
  Star,
  Share2,
  MoreHorizontal,
  X,
  Eye,
  Link,
  Copy,
  CheckCircle,
  Wallet,
  ExternalLink,
  RefreshCw,
} from "lucide-react-native";
import useStore from "@/store/useStore";
import { useTranslation } from "@/utils/i18n";
import { signCredential } from "@/utils/crypto";
import { CHAIN_CONFIG } from "@/utils/blockchain";

import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";

// Mock credentials for demo
const MOCK_CREDENTIALS = [
  {
    issuer: "did:key:z6MkSwiggy2024India",
    subject: "demo",
    claims: {
      platform: "Swiggy",
      rating: 4.8,
      deliveries: 1247,
      years: 2.5,
    },
    iat: Math.floor(Date.now() / 1000) - 86400 * 60,
  },
  {
    issuer: "did:key:z6MkZomato2024India",
    subject: "demo",
    claims: {
      platform: "Zomato",
      rating: 4.6,
      deliveries: 892,
      years: 1.8,
    },
    iat: Math.floor(Date.now() / 1000) - 86400 * 45,
  },
  {
    issuer: "did:key:z6MkUber2024India",
    subject: "demo",
    claims: {
      platform: "Uber",
      rating: 4.9,
      deliveries: 2156,
      years: 3.2,
    },
    iat: Math.floor(Date.now() / 1000) - 86400 * 120,
  },
];

export default function MyCredentialsScreen() {
  const insets = useSafeAreaInsets();
  const { credentials, did, language, profile, walletBalance, walletBalanceLoading, fetchBalance } = useStore();
  const { t } = useTranslation(language);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [showSelectiveShare, setShowSelectiveShare] = useState(false);
  const [selectedFields, setSelectedFields] = useState({});
  const [generatedLink, setGeneratedLink] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (did) fetchBalance();
  }, [did]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  }, []);

  // Show real credentials, fall back to demo data
  const hasRealCredentials = credentials.length > 0;
  const displayCredentials = hasRealCredentials ? credentials : MOCK_CREDENTIALS;
  const isMockData = !hasRealCredentials;

  const totalCredentials = displayCredentials.length;
  const averageRating =
    totalCredentials > 0
      ? (
          displayCredentials.reduce(
            (acc, curr) => acc + (curr.claims?.rating || 0),
            0,
          ) / totalCredentials
        ).toFixed(1)
      : "0.0";

  const handleSelectiveShare = (cred) => {
    setSelectedCredential(cred);
    setShowSelectiveShare(true);
    setGeneratedLink(null);
    const fields = {};
    Object.keys(cred.claims).forEach((key) => {
      fields[key] = false;
    });
    setSelectedFields(fields);
  };

  const toggleField = (field) => {
    setSelectedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const generateShareableLink = () => {
    const selectedData = {};
    Object.keys(selectedFields).forEach((key) => {
      if (selectedFields[key]) {
        selectedData[key] = selectedCredential.claims[key];
      }
    });

    if (Object.keys(selectedData).length === 0) {
      Alert.alert(
        "No Fields Selected",
        "Please select at least one field to share",
      );
      return;
    }

    // Create a shareable link with encoded data
    const encodedData = btoa(
      JSON.stringify({
        did: did,
        fields: selectedData,
        timestamp: Date.now(),
        issuer: selectedCredential.issuer,
      }),
    );
    const shareableUrl = `https://credchain.app/verify/${encodedData}`;
    setGeneratedLink(shareableUrl);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const copyLink = async () => {
    await Clipboard.setStringAsync(generatedLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied!", "Shareable link copied to clipboard");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hey {profile.name || "Credesters"}
          </Text>
        </View>
        {isMockData && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletRow}>
            <View style={styles.walletLeft}>
              <Wallet size={18} color="#7c3aed" />
              <Text style={styles.walletLabel}>Wallet</Text>
            </View>
            <Text style={styles.walletBalance}>
              {walletBalanceLoading ? "..." : `${parseFloat(walletBalance || "0").toFixed(4)} POL`}
            </Text>
          </View>
          <Text style={styles.walletNetwork}>{CHAIN_CONFIG.chainName}</Text>
          {parseFloat(walletBalance || "0") < 0.01 && (
            <TouchableOpacity
              style={styles.faucetButton}
              onPress={() => Linking.openURL("https://faucet.polygon.technology/")}
            >
              <Text style={styles.faucetText}>Get Free Test POL</Text>
              <ExternalLink size={12} color="#7c3aed" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{averageRating}</Text>
            <Text style={styles.summaryLabel}>{t("avgRating")}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalCredentials}</Text>
            <Text style={styles.summaryLabel}>{t("totalCredentials")}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {new Set(displayCredentials.map((c) => c.claims.platform)).size}
            </Text>
            <Text style={styles.summaryLabel}>{t("platforms")}</Text>
          </View>
        </View>

        {isMockData && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Sample credentials shown below. Receive real credentials via QR scan.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("myCredentials")}</Text>
        </View>

        {displayCredentials.map((cred, index) => (
          <View
            key={index}
            style={styles.credCard}
          >
            <View style={styles.credHeader}>
              <View style={styles.platformIcon}>
                <Text style={styles.platformInitial}>
                  {cred.claims?.platform?.charAt(0) || "P"}
                </Text>
              </View>
              <View style={styles.credTitleContainer}>
                <Text style={styles.platformName}>
                  {cred.claims?.platform || "Platform"}
                </Text>
                <Text style={styles.issuanceDate}>
                  Issued: {new Date(cred.iat * 1000).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity>
                <MoreHorizontal size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.credStats}>
              {cred.onChain && (
                <View style={styles.onChainBadge}>
                  <CheckCircle size={12} color="#16a34a" />
                  <Text style={styles.onChainText}>On-Chain</Text>
                </View>
              )}
              <View style={styles.stat}>
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.statText}>
                  {cred.claims?.rating || "0.0"}
                </Text>
              </View>
              <Text style={styles.statDivider}>•</Text>
              <Text style={styles.statText}>
                {cred.claims?.deliveries || 0} tasks
              </Text>
              <Text style={styles.statDivider}>•</Text>
              <Text style={styles.statText}>
                {cred.claims?.years || 0} years
              </Text>
            </View>

            <View style={styles.credFooter}>
              <TouchableOpacity
                style={styles.shareIconButton}
                onPress={() => {
                  setSelectedCredential(cred);
                  setShowSelectiveShare(false);
                }}
              >
                <Share2 size={16} color="#2563eb" />
                <Text style={styles.shareText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectiveShareButton}
                onPress={() => handleSelectiveShare(cred)}
              >
                <Eye size={16} color="#475569" />
                <Text style={styles.selectiveShareText}>Selective</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={selectedCredential !== null && !showSelectiveShare}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Credential</Text>
              <TouchableOpacity onPress={() => setSelectedCredential(null)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedCredential && (
              <View style={styles.qrPlaceholder}>
                <QRCode
                  value={JSON.stringify({
                    issuer: selectedCredential.issuer,
                    subject: selectedCredential.subject || did,
                    claims: selectedCredential.claims,
                    iat: selectedCredential.iat,
                  })}
                  size={200}
                  backgroundColor="#f8fafc"
                />
              </View>
            )}
            <Text style={styles.tokenLabel}>Scan this QR to import credential</Text>
          </View>
        </View>
      </Modal>

      {/* Selective Share Modal */}
      <Modal visible={showSelectiveShare} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Fields to Share</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowSelectiveShare(false);
                  setSelectedCredential(null);
                  setGeneratedLink(null);
                }}
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Choose what information you want to share
            </Text>

            <ScrollView style={styles.fieldsList}>
              {selectedCredential &&
                Object.entries(selectedCredential.claims).map(
                  ([key, value]) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.fieldItem}
                      onPress={() => toggleField(key)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedFields[key] && styles.checkboxActive,
                        ]}
                      >
                        {selectedFields[key] && (
                          <View style={styles.checkmark} />
                        )}
                      </View>
                      <View style={styles.fieldInfo}>
                        <Text style={styles.fieldKey}>{key}</Text>
                        <Text style={styles.fieldValue}>{String(value)}</Text>
                      </View>
                    </TouchableOpacity>
                  ),
                )}
            </ScrollView>

            {!generatedLink ? (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={generateShareableLink}
              >
                <Link size={18} color="#ffffff" />
                <Text style={styles.shareButtonText}>Generate Link</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.linkContainer}>
                <View style={styles.linkBox}>
                  <Text style={styles.linkLabel}>Your Shareable Link</Text>
                  <Text style={styles.linkText} numberOfLines={2}>
                    {generatedLink}
                  </Text>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={copyLink}>
                  <Copy size={18} color="#ffffff" />
                  <Text style={styles.copyButtonText}>Copy Link</Text>
                </TouchableOpacity>
                <Text style={styles.linkHint}>
                  Share this link to showcase your selected credentials
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  activeBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  activeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#2563eb",
    letterSpacing: 0.5,
  },
  did: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    width: 200,
  },
  demoBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  demoText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#d97706",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  summaryDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#f1f5f9",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  credCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  credHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  platformInitial: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#475569",
  },
  credTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  platformName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginBottom: 2,
  },
  issuanceDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
  },
  credStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  onChainBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
    marginRight: 8,
  },
  onChainText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#16a34a",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
  },
  statDivider: {
    marginHorizontal: 8,
    color: "#cbd5e1",
  },
  credFooter: {
    flexDirection: "row",
    gap: 12,
  },
  shareIconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
  },
  shareText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#2563eb",
  },
  selectiveShareButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectiveShareText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
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
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  qrPlaceholder: {
    height: 250,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  qrText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  qrSubtext: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    marginTop: 4,
  },
  tokenLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
    marginBottom: 8,
  },
  tokenBox: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tokenText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  fieldsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  fieldItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldKey: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    marginBottom: 16,
  },
  linkContainer: {
    gap: 12,
  },
  linkBox: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  linkLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  linkText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
    lineHeight: 18,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  linkHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    textAlign: "center",
  },
  walletCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  walletLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  walletBalance: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  walletNetwork: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    marginBottom: 4,
  },
  faucetButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  faucetText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#7c3aed",
  },
  demoBanner: {
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  demoBannerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#92400e",
    textAlign: "center",
    lineHeight: 18,
  },
});
