import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  User,
  Star,
  Calendar,
  ChevronRight,
  Search,
} from "lucide-react-native";
import useStore from "@/store/useStore";


export default function MyWorkersScreen() {
  const insets = useSafeAreaInsets();
  const { issuedCredentials } = useStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Workers</Text>
        <Text style={styles.subtitle}>
          Workers you have issued credentials to
        </Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <Text style={styles.searchText}>Search workers by DID...</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {issuedCredentials.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color="#e2e8f0" />
            <Text style={styles.emptyText}>No workers yet</Text>
            <Text style={styles.emptySubtext}>
              Once you issue credentials, workers will appear here.
            </Text>
          </View>
        ) : (
          issuedCredentials.map((cred, index) => (
            <View
              key={index}
              style={styles.workerCard}
            >
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

              <View style={styles.workerFooter}>
                <View style={styles.dateInfo}>
                  <Calendar size={14} color="#94a3b8" />
                  <Text style={styles.dateText}>
                    Issued: {new Date(cred.iat * 1000).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsText}>View Details</Text>
                  <ChevronRight size={14} color="#16a34a" />
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
  searchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
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
    marginBottom: 16,
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
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#16a34a",
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
