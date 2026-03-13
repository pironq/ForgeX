import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building2,
  Shield,
  LogOut,
  ChevronRight,
  RefreshCw,
  Copy,
  Award,
  Users,
  TrendingUp,
  Edit,
} from "lucide-react-native";
import useStore from "@/store/useStore";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

export default function EnterpriseProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    did,
    reset,
    role,
    issuedCredentials,
    enterpriseProfile,
    updateEnterpriseProfile,
  } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(
    enterpriseProfile || { name: "" },
  );

  const stats = {
    totalIssued: issuedCredentials.length,
    activeWorkers: new Set(issuedCredentials.map((c) => c.workerDid)).size,
    avgRating:
      issuedCredentials.length > 0
        ? (
            issuedCredentials.reduce(
              (acc, c) => acc + (c.claims?.rating || 0),
              0,
            ) / issuedCredentials.length
          ).toFixed(1)
        : "0.0",
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
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
    Alert.alert("Copied!", "Enterprise DID copied to clipboard");
  };

  const switchToWorker = () => {
    Alert.alert("Switch to Worker Mode", "Switch to Gig Worker view?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Switch",
        onPress: () => {
          useStore.setState({ role: "worker" });
          router.replace("/(worker)");
        },
      },
    ]);
  };

  const handleSaveProfile = () => {
    updateEnterpriseProfile(editedProfile);
    setIsEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Enterprise name updated successfully");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Enterprise Profile</Text>
        {!isEditing && (
          <TouchableOpacity
            onPress={() => {
              setEditedProfile(enterpriseProfile || { name: "" });
              setIsEditing(true);
            }}
          >
            <Edit size={20} color="#16a34a" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Building2 size={32} color="#16a34a" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.roleName}>
              {enterpriseProfile?.name || "Enterprise Account"}
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

        {/* Enterprise Name Edit */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Enterprise Information</Text>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Enterprise Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.name}
                onChangeText={(text) =>
                  setEditedProfile({ ...editedProfile, name: text })
                }
                placeholder="Enter your enterprise name"
                placeholderTextColor="#94a3b8"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {enterpriseProfile?.name || "Not set"}
              </Text>
            )}
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#fef3c7" }]}
              >
                <Award size={20} color="#d97706" />
              </View>
              <Text style={styles.statValue}>{stats.totalIssued}</Text>
              <Text style={styles.statLabel}>Total Issued</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#dbeafe" }]}
              >
                <Users size={20} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>{stats.activeWorkers}</Text>
              <Text style={styles.statLabel}>Workers</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#dcfce7" }]}
              >
                <TrendingUp size={20} color="#16a34a" />
              </View>
              <Text style={styles.statValue}>{stats.avgRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account Settings</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              Alert.alert(
                "Security Settings",
                "Advanced security features coming soon",
              )
            }
          >
            <View style={[styles.settingIcon, { backgroundColor: "#f0fdf4" }]}>
              <Shield size={20} color="#16a34a" />
            </View>
            <Text style={styles.settingText}>Security Center</Text>
            <ChevronRight size={18} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={switchToWorker}>
            <View style={[styles.settingIcon, { backgroundColor: "#eff6ff" }]}>
              <RefreshCw size={20} color="#2563eb" />
            </View>
            <Text style={styles.settingText}>Switch to Worker Mode</Text>
            <ChevronRight size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>CredChain Enterprise v1.0.0</Text>
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
    borderWidth: 2,
    borderColor: "#16a34a",
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
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  didText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#16a34a",
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
    backgroundColor: "#16a34a",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    textAlign: "center",
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
});
