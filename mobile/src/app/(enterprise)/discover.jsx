import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  MapPin,
  Star,
  User,
  Briefcase,
  Award,
  ChevronRight,
  Filter,
  Lock,
  Shield,
} from "lucide-react-native";
import useStore from "@/store/useStore";
import { discoverWorkers, fetchDiscoverFilters } from "@/utils/api";

export default function DiscoverWorkers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isEnterpriseVerified, enterpriseVerificationLoading } = useStore();

  const [workers, setWorkers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [filterOptions, setFilterOptions] = useState({ cities: [], states: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    if (isEnterpriseVerified) {
      loadFilters();
      handleSearch();
    }
  }, [isEnterpriseVerified]);

  const loadFilters = async () => {
    const filters = await fetchDiscoverFilters();
    setFilterOptions(filters);
  };

  const handleSearch = async () => {
    setLoading(true);
    const result = await discoverWorkers({
      city: city.trim() || undefined,
      state: selectedState || state.trim() || undefined,
      minRating: minRating > 0 ? minRating : undefined,
    });
    setWorkers(result.workers || []);
    setTotal(result.total || 0);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleSearch();
    setRefreshing(false);
  }, [city, state, selectedState, minRating]);

  const clearFilters = () => {
    setCity("");
    setState("");
    setSelectedState("");
    setMinRating(0);
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIcon}>
            <Lock size={40} color="#ef4444" />
          </View>
          <Text style={styles.lockedTitle}>Verification Required</Text>
          <Text style={styles.lockedDesc}>
            Your enterprise must be verified to discover workers.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover Workers</Text>
        <Text style={styles.subtitle}>Find gig workers by location and ratings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
        }
      >
        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <View style={[styles.filterInput, { flex: 1 }]}>
              <MapPin size={16} color="#94a3b8" />
              <TextInput
                style={styles.filterText}
                placeholder="City"
                placeholderTextColor="#94a3b8"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.filterInput, { flex: 1 }]}>
              <MapPin size={16} color="#94a3b8" />
              <TextInput
                style={styles.filterText}
                placeholder="State"
                placeholderTextColor="#94a3b8"
                value={state}
                onChangeText={(v) => {
                  setState(v);
                  setSelectedState("");
                }}
              />
            </View>
          </View>

          {/* Rating Filter */}
          <View style={styles.ratingFilter}>
            <Text style={styles.ratingLabel}>Min Rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setMinRating(minRating === n ? 0 : n)}
                >
                  <Star
                    size={24}
                    color={n <= minRating ? "#f59e0b" : "#e2e8f0"}
                    fill={n <= minRating ? "#f59e0b" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
              {minRating > 0 && (
                <Text style={styles.ratingValue}>{minRating}+</Text>
              )}
            </View>
          </View>

          {/* Search + Clear Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Search size={18} color="#ffffff" />
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
            {(city || state || selectedState || minRating > 0) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  clearFilters();
                  // Search after clear
                  setTimeout(() => handleSearch(), 100);
                }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick State Chips */}
          {filterOptions.states.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {filterOptions.states.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    selectedState === s && styles.chipActive,
                  ]}
                  onPress={() => {
                    setSelectedState(selectedState === s ? "" : s);
                    setState("");
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedState === s && styles.chipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {loading ? "Searching..." : `${total} worker${total !== 1 ? "s" : ""} found`}
          </Text>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        )}

        {/* Empty State */}
        {!loading && workers.length === 0 && (
          <View style={styles.emptyState}>
            <User size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No workers found</Text>
            <Text style={styles.emptyDesc}>
              Try adjusting your filters or search in a different city
            </Text>
          </View>
        )}

        {/* Worker Cards */}
        {!loading &&
          workers.map((worker, index) => (
            <View key={worker.walletAddress || index} style={styles.workerCard}>
              <View style={styles.workerTop}>
                <View style={styles.workerAvatar}>
                  <User size={22} color="#16a34a" />
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{worker.name || "Anonymous"}</Text>
                  <View style={styles.workerLocation}>
                    <MapPin size={12} color="#94a3b8" />
                    <Text style={styles.locationText}>
                      {[worker.city, worker.state].filter(Boolean).join(", ") || "—"}
                    </Text>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.ratingBadgeText}>
                    {worker.avgRating?.toFixed(1) || "0.0"}
                  </Text>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.workerStats}>
                <View style={styles.statItem}>
                  <Award size={14} color="#2563eb" />
                  <Text style={styles.statText}>
                    {worker.totalCredentials || 0} credential{worker.totalCredentials !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.statDot} />
                <View style={styles.statItem}>
                  <Briefcase size={14} color="#64748b" />
                  <Text style={styles.statText}>
                    {worker.totalDeliveries || 0} deliveries
                  </Text>
                </View>
              </View>

              {/* Platforms */}
              {worker.credentials && worker.credentials.length > 0 && (
                <View style={styles.platformsRow}>
                  {worker.credentials.map((cred, i) => (
                    <View key={i} style={styles.platformChip}>
                      <Text style={styles.platformChipText}>{cred.platform}</Text>
                      <Text style={styles.platformRating}>★ {cred.rating?.toFixed(1)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Issue Button */}
              <TouchableOpacity
                style={styles.issueButton}
                onPress={() =>
                  router.push({
                    pathname: "/(enterprise)/issue",
                    params: { workerDid: worker.walletAddress },
                  })
                }
              >
                <Text style={styles.issueButtonText}>Issue Credential</Text>
                <ChevronRight size={16} color="#16a34a" />
              </TouchableOpacity>
            </View>
          ))}
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
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    marginTop: 4,
  },
  filterSection: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  filterInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
  },
  ratingFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#f59e0b",
    marginLeft: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  searchButton: {
    flex: 1,
    backgroundColor: "#16a34a",
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  searchButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  clearButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  chipScroll: {
    marginTop: 12,
  },
  chip: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  chipTextActive: {
    color: "#16a34a",
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#94a3b8",
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  workerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  workerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
  },
  workerLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#d97706",
  },
  workerStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
  },
  platformsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  platformChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
  },
  platformRating: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#f59e0b",
  },
  issueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    height: 44,
    marginTop: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  issueButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#16a34a",
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
  },
});
