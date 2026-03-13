import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  QrCode,
  Clipboard,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { verifyCredential } from "@/utils/crypto";
import useStore from "@/store/useStore";
import * as Haptics from "expo-haptics";

export default function ReceiveCredentialScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [manualJson, setManualJson] = useState("");
  const [preview, setPreview] = useState(null);
  const addCredential = useStore((state) => state.addCredential);
  const receivedLog = useStore((state) => state.receivedLog);

  if (!permission) return <View />;

  const handleScanPress = async () => {
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please grant camera access to scan QR codes",
        );
        return;
      }
    }
    setScanning(true);
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanning(false);
    processCredential(data);
  };

  const processCredential = (data) => {
    try {
      // Try parsing as JSON first (from QR code scan)
      let parsed = null;
      try {
        parsed = JSON.parse(data);
      } catch {}

      if (parsed && parsed.claims) {
        // Direct JSON format from QR: { issuer, subject, claims, iat }
        setPreview({
          valid: true,
          issuer: parsed.issuer || "Unknown",
          subject: parsed.subject || "",
          claims: parsed.claims,
          iat: parsed.iat,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      // Otherwise try JWT token format
      const result = verifyCredential(data);
      if (result.valid) {
        setPreview(result);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Invalid Credential", result.error);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to process credential data.");
    }
  };

  const handleAccept = () => {
    addCredential(preview);
    setPreview(null);
    setManualJson("");
    Alert.alert("Success", "Credential saved to your wallet.");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (preview) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Credential Preview</Text>
          <Text style={styles.previewSubtitle}>
            Review the details before accepting
          </Text>
        </View>

        <ScrollView style={styles.previewCard}>
          <View style={styles.issuerRow}>
            <Text style={styles.label}>Issuer DID</Text>
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
              {preview.issuer}
            </Text>
          </View>

          <View style={styles.divider} />

          {Object.entries(preview.claims).map(([key, val]) => (
            <View key={key} style={styles.claimRow}>
              <Text style={styles.claimLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Text style={styles.claimValue}>{String(val)}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.previewFooter}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => setPreview(null)}
          >
            <XCircle size={20} color="#ef4444" />
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <CheckCircle2 size={20} color="#ffffff" />
            <Text style={styles.acceptText}>Accept & Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Receive Credential</Text>
        <Text style={styles.subtitle}>
          Get a new verified credential from an issuer
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {scanning ? (
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
            </View>
            <TouchableOpacity
              style={styles.closeScanner}
              onPress={() => setScanning(false)}
            >
              <Text style={styles.closeScannerText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleScanPress}
            >
              <View style={[styles.optionIcon, { backgroundColor: "#eff6ff" }]}>
                <QrCode size={32} color="#2563eb" />
              </View>
              <Text style={styles.optionTitle}>Scan QR Code</Text>
              <Text style={styles.optionDesc}>
                Scan the credential QR from the issuer's screen
              </Text>
            </TouchableOpacity>

            <View style={styles.manualSection}>
              <Text style={styles.manualLabel}>Or paste credential token</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Paste JWT token here..."
                multiline
                numberOfLines={4}
                value={manualJson}
                onChangeText={setManualJson}
              />
              <TouchableOpacity
                style={[
                  styles.processButton,
                  !manualJson && styles.processButtonDisabled,
                ]}
                onPress={() => processCredential(manualJson)}
                disabled={!manualJson}
              >
                <Clipboard size={18} color="#ffffff" />
                <Text style={styles.processButtonText}>Process Token</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Log History Section */}
        {receivedLog.length > 0 && (
          <View style={styles.logSection}>
            <View style={styles.logHeader}>
              <Clock size={20} color="#64748b" />
              <Text style={styles.logTitle}>Received History</Text>
            </View>

            {receivedLog
              .slice()
              .reverse()
              .map((log, index) => (
                <View key={index} style={styles.logItem}>
                  <View style={styles.logIconContainer}>
                    <Award size={16} color="#16a34a" />
                  </View>
                  <View style={styles.logContent}>
                    <Text style={styles.logPlatform}>
                      {log.claims?.platform || "Credential"}
                    </Text>
                    <View style={styles.logMeta}>
                      <Text style={styles.logDate}>
                        {new Date(log.receivedAt).toLocaleDateString()} at{" "}
                        {new Date(log.receivedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {log.claims?.rating && (
                        <View style={styles.logRating}>
                          <Text style={styles.logRatingText}>
                            ★ {log.claims.rating}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View
                    style={[styles.logStatus, { backgroundColor: "#dcfce7" }]}
                  >
                    <CheckCircle2 size={14} color="#16a34a" />
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
    backgroundColor: "#ffffff",
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
  scrollContent: {
    paddingHorizontal: 24,
  },
  optionsContainer: {
    gap: 32,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  optionDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  manualSection: {
    gap: 12,
  },
  manualLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
  },
  manualInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1e293b",
    textAlignVertical: "top",
    minHeight: 100,
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  processButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  processButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  scannerContainer: {
    height: 400,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 40,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  closeScanner: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  closeScannerText: {
    color: "#ffffff",
    fontFamily: "Inter_600SemiBold",
  },
  previewHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  previewSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  previewCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  issuerRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#334155",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  claimRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  claimLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
  },
  claimValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  previewFooter: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 8,
  },
  rejectText: {
    color: "#ef4444",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  acceptButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    backgroundColor: "#16a34a",
    gap: 8,
  },
  acceptText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  logSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  logTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  logIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logPlatform: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1e293b",
    marginBottom: 4,
  },
  logMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748b",
  },
  logRating: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logRatingText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#d97706",
  },
  logStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
