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
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  QrCode,
  Clipboard,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Info,
} from "lucide-react-native";
import { verifyCredential } from "@/utils/crypto";
import * as Haptics from "expo-haptics";


export default function VerifyCredentialScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [result, setResult] = useState(null);

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
    processVerification(data);
  };

  const processVerification = (token) => {
    const verification = verifyCredential(token);
    setResult(verification);
    if (verification.valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (result) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.resultHeader}>
          <View style={styles.resultIcon}>
            {result.valid ? (
              <CheckCircle2 size={80} color="#16a34a" />
            ) : (
              <XCircle size={80} color="#ef4444" />
            )}
          </View>
          <Text
            style={[
              styles.resultTitle,
              { color: result.valid ? "#16a34a" : "#ef4444" },
            ]}
          >
            {result.valid ? "Verified Success" : "Invalid Credential"}
          </Text>
        </View>

        <ScrollView style={styles.resultDetails}>
          {result.valid ? (
            <>
              <View style={styles.detailGroup}>
                <Text style={styles.detailLabel}>Subject (Worker)</Text>
                <View style={styles.didBadge}>
                  <User size={14} color="#64748b" />
                  <Text
                    style={styles.didText}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {result.subject}
                  </Text>
                </View>
              </View>

              <View style={styles.detailGroup}>
                <Text style={styles.detailLabel}>Issuer</Text>
                <View style={styles.didBadge}>
                  <ShieldCheck size={14} color="#64748b" />
                  <Text
                    style={styles.didText}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {result.issuer}
                  </Text>
                </View>
              </View>

              <View style={styles.claimsContainer}>
                <Text style={styles.detailLabel}>Claims</Text>
                {Object.entries(result.claims).map(([key, val]) => (
                  <View key={key} style={styles.claimRow}>
                    <Text style={styles.claimKey}>{key}</Text>
                    <Text style={styles.claimVal}>{String(val)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Info size={24} color="#ef4444" />
              <Text style={styles.errorText}>
                {result.error ||
                  "This credential could not be verified. It may have been tampered with or is improperly formatted."}
              </Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setResult(null);
            setManualToken("");
          }}
        >
          <Text style={styles.resetButtonText}>Verify Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify Credential</Text>
        <Text style={styles.subtitle}>
          Check the authenticity of a worker's record
        </Text>
      </View>

      <View style={styles.content}>
        {scanning ? (
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            <TouchableOpacity
              style={styles.closeScanner}
              onPress={() => setScanning(false)}
            >
              <Text style={styles.closeScannerText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.verifyOptions}>
            <TouchableOpacity style={styles.scanCard} onPress={handleScanPress}>
              <QrCode size={40} color="#16a34a" />
              <Text style={styles.scanCardTitle}>Scan Worker QR</Text>
              <Text style={styles.scanCardDesc}>
                Verify a credential presented by a worker
              </Text>
            </TouchableOpacity>

            <View style={styles.manualSection}>
              <Text style={styles.manualLabel}>Or paste credential token</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Paste JWT here..."
                multiline
                numberOfLines={4}
                value={manualToken}
                onChangeText={setManualToken}
              />
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  !manualToken && styles.verifyButtonDisabled,
                ]}
                onPress={() => processVerification(manualToken)}
                disabled={!manualToken}
              >
                <ShieldCheck size={20} color="#ffffff" />
                <Text style={styles.verifyButtonText}>Verify Token</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  verifyOptions: {
    flex: 1,
    gap: 32,
  },
  scanCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  scanCardTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#16a34a",
    marginTop: 16,
    marginBottom: 8,
  },
  scanCardDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#15803d",
    textAlign: "center",
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
    minHeight: 100,
    textAlignVertical: "top",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    height: 52,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  verifyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  scannerContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 40,
  },
  camera: {
    flex: 1,
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
  resultHeader: {
    alignItems: "center",
    paddingVertical: 40,
  },
  resultIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  resultDetails: {
    flex: 1,
    paddingHorizontal: 24,
  },
  detailGroup: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  didBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  didText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#475569",
  },
  claimsContainer: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  claimRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  claimKey: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748b",
    textTransform: "capitalize",
  },
  claimVal: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#1e293b",
  },
  errorContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#b91c1c",
    textAlign: "center",
    lineHeight: 20,
  },
  resetButton: {
    marginHorizontal: 24,
    marginBottom: 20,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
