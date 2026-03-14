import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Send,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react-native";
import useStore from "@/store/useStore";
import * as Haptics from "expo-haptics";

export default function RequestCredential() {
  const insets = useSafeAreaInsets();
  const {
    did,
    credentialRequests,
    credentialRequestsLoading,
    fetchCredentialRequests,
    createCredentialRequest,
  } = useStore();

  const [enterpriseAddress, setEnterpriseAddress] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (did) fetchCredentialRequests({ worker: did });
  }, [did]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (did) await fetchCredentialRequests({ worker: did });
    setRefreshing(false);
  }, [did]);

  const handleSubmit = async () => {
    const trimmed = enterpriseAddress.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter the enterprise wallet address");
      return;
    }
    if (!trimmed.startsWith("0x") || trimmed.length !== 42) {
      Alert.alert("Error", "Please enter a valid wallet address (0x...)");
      return;
    }

    setSubmitting(true);
    try {
      await createCredentialRequest(trimmed, message.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Request Sent", "Your credential request has been sent to the enterprise.");
      setEnterpriseAddress("");
      setMessage("");
    } catch (error) {
      Alert.alert("Error", "Failed to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return { bg: "#dcfce7", text: "#16a34a", icon: CheckCircle2 };
      case "rejected":
        return { bg: "#fef2f2", text: "#ef4444", icon: XCircle };
      default:
        return { bg: "#fef3c7", text: "#d97706", icon: AlertCircle };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Request Credential</Text>
          <Text style={styles.subtitle}>Ask an enterprise to issue a credential for you</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Enterprise Wallet Address</Text>
            <View style={styles.inputWrapper}>
              <Building2 size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="0x..."
                placeholderTextColor="#94a3b8"
                value={enterpriseAddress}
                onChangeText={setEnterpriseAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message (optional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="e.g. I delivered for your platform for 2 years..."
              placeholderTextColor="#94a3b8"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Send size={18} color="#ffffff" />
                <Text style={styles.submitText}>Send Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* My Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>My Requests</Text>
            {credentialRequestsLoading && (
              <ActivityIndicator size="small" color="#2563eb" style={{ marginLeft: 8 }} />
            )}
          </View>

          {credentialRequests.length === 0 && !credentialRequestsLoading ? (
            <View style={styles.emptyState}>
              <MessageSquare size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyDesc}>
                Send a request to an enterprise to get started
              </Text>
            </View>
          ) : (
            credentialRequests.map((req) => {
              const statusStyle = getStatusStyle(req.status);
              const StatusIcon = statusStyle.icon;
              return (
                <View key={req._id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.enterpriseIcon}>
                      <Building2 size={18} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestAddress} numberOfLines={1} ellipsizeMode="middle">
                        {req.enterpriseAddress}
                      </Text>
                      <Text style={styles.requestDate}>
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <StatusIcon size={12} color={statusStyle.text} />
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {req.message ? (
                    <Text style={styles.requestMessage} numberOfLines={2}>
                      {req.message}
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
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
  formCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
  },
  messageInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 80,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
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
  },
  requestCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  enterpriseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  requestAddress: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
  },
  requestDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  requestMessage: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    marginTop: 10,
    paddingLeft: 52,
  },
});
