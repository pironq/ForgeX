import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
} from "lucide-react-native";
import useStore from "@/store/useStore";


export default function EnterpriseDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { issuedCredentials, did, enterpriseProfile } = useStore();

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
});
