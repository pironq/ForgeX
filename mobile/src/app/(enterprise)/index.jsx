import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Users,
  ShieldCheck,
  PlusCircle,
  TrendingUp,
  Award,
  ChevronRight,
  Lock,
  Shield,
  Wallet,
  ExternalLink,
  RefreshCw,
  Inbox,
  Search,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react-native";
import useStore from "@/store/useStore";
import { CHAIN_CONFIG, getExplorerUrl } from "@/utils/blockchain";


export default function EnterpriseDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { issuedCredentials, did, enterpriseProfile, isEnterpriseVerified, enterpriseVerificationLoading, walletBalance, walletBalanceLoading, fetchBalance, checkEnterpriseVerification, credentialRequests, fetchCredentialRequests, updateCredentialRequestStatus } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (did && isEnterpriseVerified) {
      fetchBalance();
      fetchCredentialRequests({ enterprise: did });
    }
  }, [did, isEnterpriseVerified]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchBalance(),
      checkEnterpriseVerification(),
      fetchCredentialRequests({ enterprise: did }),
    ]);
    setRefreshing(false);
  }, [did]);

  const stats = {
    totalIssued: issuedCredentials.length,
    avgRating:
      issuedCredentials.length > 0
        ? (
            issuedCredentials.reduce(
              (acc, c) => acc + (c.claims?.rating || 0),
              0,
            ) / issuedCredentials.length
          ).toFixed(1)
        : "0.0",
    activeWorkers: new Set(issuedCredentials.map((c) => c.workerDid)).size,
  };

  if (enterpriseVerificationLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Checking verification status...</Text>
      </View>
    );
  }

  if (!isEnterpriseVerified) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Enterprise Dashboard</Text>
            <Text style={styles.companyName}>
              {enterpriseProfile?.name || "CredChain Platform"}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#fef2f2" }]}>
            <Shield size={20} color="#ef4444" />
          </View>
        </View>
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIcon}>
            <Lock size={40} color="#ef4444" />
          </View>
          <Text style={styles.lockedTitle}>Verification Required</Text>
          <Text style={styles.lockedDesc}>
            Your enterprise account is pending verification. To issue credentials, please contact the CredChain team to get verified.
          </Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>CONTACT SUPPORT</Text>
            <Text style={styles.contactEmail}>support@credchain.app</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Enterprise Dashboard</Text>
          <Text style={styles.companyName}>
            {enterpriseProfile?.name || "CredChain Platform"}
          </Text>
        </View>
        <View style={styles.badge}>
          <ShieldCheck size={20} color="#16a34a" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.totalIssued}</Text>
            <Text style={styles.statLabel}>Credentials Issued</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users size={24} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{stats.activeWorkers}</Text>
            <Text style={styles.statLabel}>Active Workers</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp size={24} color="#16a34a" />
            </View>
            <Text style={styles.statValue}>{stats.avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletLeft}>
              <Wallet size={20} color="#7c3aed" />
              <Text style={styles.walletTitle}>Wallet Balance</Text>
            </View>
            <TouchableOpacity onPress={fetchBalance} disabled={walletBalanceLoading}>
              <RefreshCw size={16} color={walletBalanceLoading ? "#cbd5e1" : "#64748b"} />
            </TouchableOpacity>
          </View>
          <Text style={styles.walletBalance}>
            {walletBalanceLoading ? "..." : `${parseFloat(walletBalance || "0").toFixed(4)} POL`}
          </Text>
          <Text style={styles.walletNetwork}>{CHAIN_CONFIG.chainName}</Text>
          {parseFloat(walletBalance || "0") < 0.01 && (
            <TouchableOpacity
              style={styles.faucetButton}
              onPress={() => Linking.openURL("https://faucet.polygon.technology/")}
            >
              <Text style={styles.faucetText}>Get Free Test POL</Text>
              <ExternalLink size={14} color="#7c3aed" />
            </TouchableOpacity>
          )}
        </View>

        {/* Pending Credential Requests */}
        {credentialRequests.filter((r) => r.status === "pending").length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Inbox size={20} color="#d97706" />
              <Text style={styles.sectionTitle}>
                Pending Requests ({credentialRequests.filter((r) => r.status === "pending").length})
              </Text>
            </View>
            {credentialRequests
              .filter((r) => r.status === "pending")
              .map((req) => (
                <View key={req._id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestWorker} numberOfLines={1} ellipsizeMode="middle">
                      {req.workerAddress}
                    </Text>
                    {req.message ? (
                      <Text style={styles.requestMessage} numberOfLines={2}>
                        {req.message}
                      </Text>
                    ) : null}
                    <Text style={styles.requestDate}>
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={async () => {
                        await updateCredentialRequestStatus(req._id, "approved");
                        router.push({
                          pathname: "/(enterprise)/issue",
                          params: { workerDid: req.workerAddress },
                        });
                      }}
                    >
                      <CheckCircle2 size={16} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => updateCredentialRequestStatus(req._id, "rejected")}
                    >
                      <XCircle size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(enterprise)/issue")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#dcfce7" }]}>
              <PlusCircle size={28} color="#16a34a" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Issue New Credential</Text>
              <Text style={styles.actionDesc}>
                Create a verified work record for a worker
              </Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(enterprise)/verify")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#dbeafe" }]}>
              <ShieldCheck size={28} color="#2563eb" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Verify Credential</Text>
              <Text style={styles.actionDesc}>
                Check authenticity of worker credentials
              </Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(enterprise)/workers")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#fef3c7" }]}>
              <Users size={28} color="#f59e0b" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>View All Workers</Text>
              <Text style={styles.actionDesc}>
                See workers you've issued credentials to
              </Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(enterprise)/discover")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#ede9fe" }]}>
              <Search size={28} color="#7c3aed" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Discover Workers</Text>
              <Text style={styles.actionDesc}>
                Find gig workers by city, state, and ratings
              </Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {issuedCredentials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Issuances</Text>
            {issuedCredentials.slice(0, 3).map((cred, index) => (
              <View key={index} style={styles.recentCard}>
                <View style={styles.recentIcon}>
                  <Award size={16} color="#16a34a" />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentPlatform}>
                    {cred.claims.platform}
                  </Text>
                  <Text style={styles.recentWorker} numberOfLines={1}>
                    {cred.workerDid?.slice(0, 20)}...
                  </Text>
                </View>
                <View style={styles.recentRating}>
                  <Text style={styles.recentRatingText}>
                    ★ {cred.claims.rating}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* On-Chain Transactions */}
        {issuedCredentials.some((c) => c.txHash) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>On-Chain Transactions</Text>
            {issuedCredentials
              .filter((c) => c.txHash)
              .slice(-5)
              .reverse()
              .map((cred, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.txCard}
                  onPress={() => Linking.openURL(getExplorerUrl(cred.txHash))}
                >
                  <View style={styles.txLeft}>
                    <View style={styles.txDot} />
                    <View>
                      <Text style={styles.txPlatform}>{cred.claims.platform}</Text>
                      <Text style={styles.txHash} numberOfLines={1}>
                        {cred.txHash.slice(0, 10)}...{cred.txHash.slice(-8)}
                      </Text>
                    </View>
                  </View>
                  <ExternalLink size={14} color="#94a3b8" />
                </TouchableOpacity>
              ))}
          </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  companyName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginTop: 2,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 24,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    lineHeight: 18,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentPlatform: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginBottom: 2,
  },
  recentWorker: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
  },
  recentRating: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recentRatingText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#d97706",
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  lockedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  lockedDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  contactLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#94a3b8",
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
  },
  walletCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  walletBalance: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  walletNetwork: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    marginBottom: 8,
  },
  faucetButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  faucetText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#7c3aed",
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  txDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },
  txPlatform: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginBottom: 2,
  },
  txHash: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  requestInfo: {
    flex: 1,
  },
  requestWorker: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginBottom: 2,
  },
  requestMessage: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    marginTop: 2,
  },
  requestDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    marginTop: 4,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
});
