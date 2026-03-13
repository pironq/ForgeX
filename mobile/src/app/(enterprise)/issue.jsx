import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PlusCircle,
  QrCode,
  CheckCircle2,
  User,
  Briefcase,
  Star,
  Info,
} from "lucide-react-native";
import { signCredential } from "@/utils/crypto";
import useStore from "@/store/useStore";
import * as Haptics from "expo-haptics";
import Svg, { Rect } from "react-native-svg";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

// Simple QR code path generator for rendering without external libs
// (In a real app, use react-native-qrcode-svg)
const MockQR = ({ value }) => (
  <View style={styles.qrPlaceholder}>
    <QrCode size={180} color="#1e293b" />
    <Text style={styles.qrValue} numberOfLines={1} ellipsizeMode="middle">
      {value}
    </Text>
  </View>
);

export default function IssueCredentialScreen() {
  const insets = useSafeAreaInsets();
  const { did, addIssuedCredential } = useStore();
  const [formData, setFormData] = useState({
    workerDid: "",
    platform: "",
    rating: "",
    deliveries: "",
    years: "",
  });
  const [issuedToken, setIssuedToken] = useState(null);

  const handleIssue = async () => {
    if (!formData.workerDid || !formData.platform || !formData.rating) {
      Alert.alert("Missing Info", "Please fill in the required fields.");
      return;
    }

    if (!did) {
      Alert.alert(
        "Error",
        "Your wallet is not initialized. Please restart the app.",
      );
      return;
    }

    try {
      const claims = {
        platform: formData.platform,
        rating: parseFloat(formData.rating),
        deliveries: parseInt(formData.deliveries) || 0,
        years: parseFloat(formData.years) || 0,
        type: "WorkRating",
      };

      const token = await signCredential(did, formData.workerDid, claims);
      setIssuedToken(token);
      addIssuedCredential({
        token,
        claims,
        workerDid: formData.workerDid,
        iat: Math.floor(Date.now() / 1000),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error issuing credential:", error);
      Alert.alert("Error", "Failed to issue credential. Please try again.");
    }
  };

  if (issuedToken) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Credential Issued!</Text>
          <Text style={styles.subtitle}>
            Ask the worker to scan this code to receive their credential.
          </Text>
        </View>

        <View style={styles.qrContainer}>
          <MockQR value={issuedToken} />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              setIssuedToken(null);
              setFormData({
                workerDid: "",
                platform: "",
                rating: "",
                deliveries: "",
                years: "",
              });
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Issue Credential</Text>
          <Text style={styles.subtitle}>
            Create a verifiable work record for a worker
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Worker's Wallet Address *</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="did:key:..."
                value={formData.workerDid}
                onChangeText={(val) =>
                  setFormData({ ...formData, workerDid: val })
                }
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Platform / Company *</Text>
            <View style={styles.inputWrapper}>
              <Briefcase size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Uber, Swiggy, Upwork"
                value={formData.platform}
                onChangeText={(val) =>
                  setFormData({ ...formData, platform: val })
                }
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Rating (0-5) *</Text>
              <View style={styles.inputWrapper}>
                <Star size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="4.8"
                  keyboardType="numeric"
                  value={formData.rating}
                  onChangeText={(val) =>
                    setFormData({ ...formData, rating: val })
                  }
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Total Deliveries</Text>
              <View style={styles.inputWrapper}>
                <PlusCircle size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="1200"
                  keyboardType="numeric"
                  value={formData.deliveries}
                  onChangeText={(val) =>
                    setFormData({ ...formData, deliveries: val })
                  }
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years on Platform</Text>
            <View style={styles.inputWrapper}>
              <Info size={18} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="2"
                keyboardType="numeric"
                value={formData.years}
                onChangeText={(val) => setFormData({ ...formData, years: val })}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.issueButton} onPress={handleIssue}>
            <CheckCircle2 size={20} color="#ffffff" />
            <Text style={styles.issueButtonText}>Sign & Issue Credential</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingAnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 52,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  issueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    height: 56,
    borderRadius: 16,
    gap: 8,
    marginTop: 12,
  },
  issueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  qrContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  qrPlaceholder: {
    backgroundColor: "#f8fafc",
    padding: 32,
    borderRadius: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 40,
  },
  qrValue: {
    marginTop: 16,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#94a3b8",
    width: 200,
    textAlign: "center",
  },
  doneButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
