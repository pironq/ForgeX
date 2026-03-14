import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  User,
  Star,
  Calendar,
  Search,
  Lock,
  Trash2,
  CheckCircle,
  Shield,
} from "lucide-react-native";
import useStore from "@/store/useStore";
import * as Haptics from "expo-haptics";

export default function MyWorkersScreen() {
  const insets = useSafeAreaInsets();
  const { issuedCredentials, isEnterpriseVerified, enterpriseVerificationLoading, removeIssuedCredential } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCredentials = issuedCredentials.filter((cred) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cred.workerDid?.toLowerCase().includes(q) ||
      cred.claims?.platform?.toLowerCase().includes(q)
    );
  });

  const handleRevoke = (index, cred) => {
    const realIndex = issuedCredentials.indexOf(cred);
    Alert.alert(
      "Revoke Credential",
      `Revoke ${cred.claims.platform} credential for ${cred.workerDid?.slice(0, 12)}...?\n\nThis removes it from your records.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () => {
            removeIssuedCredential(realIndex);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
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
          Workers Locked
        </Text>
        <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748b", textAlign: "center", lineHeight: 22 }}>
          Your enterprise must be verified to view workers. Contact support@credchain.app
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Workers</Text>
        <Text style={styles.subtitle}>
          {issuedCredentials.length} credential{issuedCredentials.length !== 1 ? "s" : ""} issued
        </Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by DID or platform..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredCredentials.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color="#e2e8f0" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No matches found" : "No workers yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search term."
                : "Once you issue credentials, workers will appear here."}
            </Text>
          </View>
        ) : (
          filteredCredentials.map((cred, index) => (
            <View key={index} style={styles.workerCard}>
              <View style={styles.workerInfo}>
                <View style={styles.workerAvatar}>
                  <User size={20} color="#16a34a" />
                </View>
                <View style={styles.workerText}>
                  <Text
                    style={styles.workerDid}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {cred.workerDid}
                  </Text>
                  <Text style={styles.credType}>
                    {cred.claims.platform} • {cred.claims.type}
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#16a34a" fill="#16a34a" />
                  <Text style={styles.ratingText}>{cred.claims.rating}</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                {cred.onChain && (
                  <View style={styles.onChainBadge}>
                    <CheckCircle size={12} color="#16a34a" />
                    <Text style={styles.onChainText}>On-Chain</Text>
                  </View>
                )}
                {cred.txHash && (
                  <View style={styles.txBadge}>
                    <Shield size={12} color="#7c3aed" />
                    <Text style={styles.txText}>
                      {cred.txHash.slice(0, 8)}...
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.workerFooter}>
                <View style={styles.dateInfo}>
                  <Calendar size={14} color="#94a3b8" />
                  <Text style={styles.dateText}>
                    {new Date(cred.iat * 1000).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.revokeButton}
                  onPress={() => handleRevoke(index, cred)}
                >
                  <Trash2 size={14} color="#ef4444" />
                  <Text style={styles.revokeText}>Revoke</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#ffffff",
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
  searchBarContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  workerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  workerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  workerText: {
    flex: 1,
    marginLeft: 12,
  },
  workerDid: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginBottom: 2,
  },
  credType: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#16a34a",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  onChainBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  onChainText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#16a34a",
  },
  txBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  txText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#7c3aed",
  },
  workerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
  },
  revokeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef2f2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  revokeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#ef4444",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
