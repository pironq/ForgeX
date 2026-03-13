import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Building2, ChevronRight } from "lucide-react-native";
import useStore from "@/store/useStore";


export default function RoleSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setRole = useStore((state) => state.setRole);

  const selectRole = (role) => {
    setRole(role);
    router.push("/onboarding/create-wallet");
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Select how you plan to use CredChain
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => selectRole("worker")}
        >
          <View
            style={[styles.iconContainer, { backgroundColor: "#eff6ff" }]}
          >
            <User size={32} color="#2563eb" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Gig Worker</Text>
            <Text style={styles.cardDescription}>
              Store and share your verified work credentials
            </Text>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => selectRole("enterprise")}
        >
          <View
            style={[styles.iconContainer, { backgroundColor: "#f0fdf4" }]}
          >
            <Building2 size={32} color="#16a34a" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Enterprise</Text>
            <Text style={styles.cardDescription}>
              Issue and manage credentials for your workers
            </Text>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.importLink}
        onPress={() => router.push("/onboarding/import-wallet")}
      >
        <Text style={styles.importText}>
          Already have a wallet? Import here
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  content: {
    flex: 1,
    gap: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    lineHeight: 20,
  },
  importLink: {
    alignItems: "center",
    paddingVertical: 20,
  },
  importText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#2563eb",
  },
});
