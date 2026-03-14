import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  User,
  Shield,
  Key,
  LogOut,
  ChevronRight,
  Copy,
  Edit,
  CheckCircle,
  Upload,
  Globe,
  ChevronLeft,
  Wallet,
  ExternalLink,
} from "lucide-react-native";
import useStore from "@/store/useStore";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import { useTranslation } from "@/utils/i18n";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { did, reset, profile, updateProfile, language, setLanguage, walletBalance, walletBalanceLoading, fetchBalance } =
    useStore();
  const { t } = useTranslation(language);

  useEffect(() => {
    if (did) fetchBalance();
  }, [did]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const handleLogout = () => {
    Alert.alert(t("logoutTitle"), t("logoutConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: () => {
          reset();
          router.replace("/onboarding/welcome");
        },
      },
    ]);
  };

  const copyDID = async () => {
    await Clipboard.setStringAsync(did);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied!", "Wallet address copied to clipboard");
  };

  const handleSaveProfile = () => {
    updateProfile(editedProfile);
    setIsEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Profile updated successfully");
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        updateProfile({ verificationStatus: "in-progress" });
        Alert.alert(
          "Document Uploaded",
          "Your identity verification is in progress. Our team will review your document within 24-48 hours.",
        );
      }
    } catch (err) {
      console.error("Document picker error:", err);
      Alert.alert("Error", "Failed to upload document");
    }
  };

  const getVerificationColor = (status) => {
    switch (status) {
      case "verified":
        return "#16a34a";
      case "in-progress":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const getVerificationBgColor = (status) => {
    switch (status) {
      case "verified":
        return "#f0fdf4";
      case "in-progress":
        return "#fffbeb";
      case "rejected":
        return "#fef2f2";
      default:
        return "#f8fafc";
    }
  };

  if (showLanguagePicker) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>{t("language")}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === "en" && styles.languageOptionActive,
            ]}
            onPress={() => {
              setLanguage("en");
              setShowLanguagePicker(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Text
              style={[
                styles.languageText,
                language === "en" && styles.languageTextActive,
              ]}
            >
              English
            </Text>
            {language === "en" && <CheckCircle size={20} color="#2563eb" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageOption,
              language === "hi" && styles.languageOptionActive,
            ]}
            onPress={() => {
              setLanguage("hi");
              setShowLanguagePicker(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Text
              style={[
                styles.languageText,
                language === "hi" && styles.languageTextActive,
              ]}
            >
              हिंदी (Hindi)
            </Text>
            {language === "hi" && <CheckCircle size={20} color="#2563eb" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("profile")}</Text>
        {!isEditing && (
          <TouchableOpacity
            onPress={() => {
              setEditedProfile(profile);
              setIsEditing(true);
            }}
          >
            <Edit size={20} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <User size={32} color="#2563eb" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.roleName}>
              Hey {profile.name || "Credesters"}
            </Text>
            <TouchableOpacity onPress={copyDID} style={styles.didBadge}>
              <Text
                style={styles.didText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {did?.slice(0, 20)}...
              </Text>
              <Copy size={12} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WALLET</Text>
          <View style={styles.walletCard}>
            <View style={styles.walletRow}>
              <View style={styles.walletLeft}>
                <Wallet size={18} color="#7c3aed" />
                <Text style={styles.walletLabel}>Balance</Text>
              </View>
              <Text style={styles.walletBalanceText}>
                {walletBalanceLoading ? "..." : `${parseFloat(walletBalance || "0").toFixed(4)} POL`}
              </Text>
            </View>
            <View style={styles.walletRow}>
              <Text style={styles.walletNetworkText}>Polygon Amoy Testnet</Text>
              <TouchableOpacity
                style={styles.faucetLink}
                onPress={() => Linking.openURL("https://faucet.polygon.technology/")}
              >
                <Text style={styles.faucetLinkText}>Get Test POL</Text>
                <ExternalLink size={12} color="#7c3aed" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("personalInfo")}</Text>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>{t("name")}</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.name}
                onChangeText={(text) =>
                  setEditedProfile({ ...editedProfile, name: text })
                }
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.name || "Not set"}</Text>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>{t("phone")}</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.phone}
                onChangeText={(text) =>
                  setEditedProfile({ ...editedProfile, phone: text })
                }
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profile.phone || "Not set"}
              </Text>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>{t("address")}</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.address}
                onChangeText={(text) =>
                  setEditedProfile({ ...editedProfile, address: text })
                }
                placeholder="Street address"
                placeholderTextColor="#94a3b8"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profile.address || "Not set"}
              </Text>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.fieldLabel}>{t("city")}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.city}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, city: text })
                  }
                  placeholder="City"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.city || "-"}</Text>
              )}
            </View>

            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>{t("pincode")}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.pincode}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, pincode: text })
                  }
                  placeholder="000000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.pincode || "-"}</Text>
              )}
            </View>
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Identity Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("verifyIdentity")}</Text>

          <View
            style={[
              styles.verificationCard,
              {
                backgroundColor: getVerificationBgColor(
                  profile.verificationStatus,
                ),
              },
            ]}
          >
            <View style={styles.verificationHeader}>
              <Shield
                size={20}
                color={getVerificationColor(profile.verificationStatus)}
              />
              <Text
                style={[
                  styles.verificationStatusText,
                  { color: getVerificationColor(profile.verificationStatus) },
                ]}
              >
                {t(profile.verificationStatus)}
              </Text>
            </View>
            <Text style={styles.verificationDesc}>{t("documentTypes")}</Text>
            {profile.verificationStatus === "pending" && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleDocumentUpload}
              >
                <Upload size={16} color="#2563eb" />
                <Text style={styles.uploadButtonText}>
                  {t("uploadDocument")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("accountSecurity")}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              Alert.alert(
                t("backupRecovery"),
                "Your phrase is stored securely. For security, we only show it during onboarding.",
              )
            }
          >
            <View style={[styles.settingIcon, { backgroundColor: "#fff7ed" }]}>
              <Key size={20} color="#ea580c" />
            </View>
            <Text style={styles.settingText}>{t("backupRecovery")}</Text>
            <ChevronRight size={18} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              Alert.alert(t("securityCenter"), "Security features coming soon")
            }
          >
            <View style={[styles.settingIcon, { backgroundColor: "#f0fdf4" }]}>
              <Shield size={20} color="#16a34a" />
            </View>
            <Text style={styles.settingText}>{t("securityCenter")}</Text>
            <ChevronRight size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("appPreferences")}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguagePicker(true)}
          >
            <View style={[styles.settingIcon, { backgroundColor: "#fef3c7" }]}>
              <Globe size={20} color="#d97706" />
            </View>
            <Text style={styles.settingText}>{t("language")}</Text>
            <View style={styles.languageBadge}>
              <Text style={styles.languageBadgeText}>
                {language === "en" ? "English" : "हिंदी"}
              </Text>
            </View>
            <ChevronRight size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>CredChain v1.0.0 (Alpha)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  didBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  didText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#2563eb",
    maxWidth: 150,
  },
  section: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  formField: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
  },
  textInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  verificationCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verificationStatusText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  verificationDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#2563eb",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#334155",
  },
  languageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    marginRight: 8,
  },
  languageBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#fff1f2",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ef4444",
  },
  versionText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
  },
  walletCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  walletBalanceText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  walletNetworkText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
  },
  faucetLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  faucetLinkText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#7c3aed",
  },
  languageContainer: {
    padding: 24,
    gap: 12,
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  languageOptionActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  languageText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  languageTextActive: {
    color: "#2563eb",
  },
});
