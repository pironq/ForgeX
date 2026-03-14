import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { fetchProfile, saveProfile, fetchEnterpriseStatus } from "@/utils/api";
import { getWalletBalance } from "@/utils/blockchain";

const useStore = create(
  persist(
    (set, get) => ({
      role: null, // 'worker' | 'enterprise'
      did: null,
      recoveryPhrase: null,
      credentials: [], // for workers
      issuedCredentials: [], // for enterprise
      receivedLog: [], // log of received credentials with timestamps
      isInitialized: false,

      // User profile fields
      profile: {
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        isVerified: false,
        verificationStatus: "pending", // 'pending' | 'in-progress' | 'verified' | 'rejected'
      },

      // Enterprise profile
      enterpriseProfile: {
        name: "", // enterprise name
      },

      // Language preference
      language: "en", // 'en' | 'hi'

      // Enterprise verification (admin-controlled)
      isEnterpriseVerified: false,
      enterpriseVerificationLoading: true,

      // Wallet balance
      walletBalance: null,
      walletBalanceLoading: false,

      setRole: (role) => set({ role }),

      setLanguage: (language) => set({ language }),

      updateProfile: async (profileData) => {
        const state = get();
        const newProfile = { ...state.profile, ...profileData };
        set({ profile: newProfile });

        // Sync to backend (fire and forget)
        if (state.did) {
          saveProfile({
            walletAddress: state.did,
            ...newProfile,
          }).catch((err) => console.warn("Failed to sync profile:", err));
        }
      },

      updateEnterpriseProfile: (profileData) =>
        set((state) => ({
          enterpriseProfile: { ...state.enterpriseProfile, ...profileData },
        })),

      checkEnterpriseVerification: async () => {
        const state = get();
        if (!state.did || state.role !== "enterprise") return;

        set({ enterpriseVerificationLoading: true });
        try {
          const result = await fetchEnterpriseStatus(state.did);
          set({
            isEnterpriseVerified: result.verified,
            enterpriseVerificationLoading: false,
          });
          if (result.verified && result.enterpriseName) {
            set((s) => ({
              enterpriseProfile: {
                ...s.enterpriseProfile,
                name: result.enterpriseName,
              },
            }));
          }
        } catch (error) {
          console.error("Enterprise verification check failed:", error);
          set({ isEnterpriseVerified: false, enterpriseVerificationLoading: false });
        }
      },

      fetchBalance: async () => {
        const state = get();
        if (!state.did) return;
        set({ walletBalanceLoading: true });
        try {
          const balance = await getWalletBalance(state.did);
          set({ walletBalance: balance, walletBalanceLoading: false });
        } catch {
          set({ walletBalance: "0", walletBalanceLoading: false });
        }
      },

      initializeWallet: async (phrase, address, privateKey) => {
        await SecureStore.setItemAsync("wallet_phrase", phrase);
        if (privateKey) {
          await SecureStore.setItemAsync("wallet_private_key", privateKey);
        }

        // Set wallet state immediately — don't block on network
        set({
          recoveryPhrase: phrase,
          did: address,
          isInitialized: true,
        });

        // Try to fetch existing profile in background (useful for imports)
        fetchProfile(address)
          .then((existingProfile) => {
            if (existingProfile) {
              set({
                profile: {
                  name: existingProfile.name || "",
                  phone: existingProfile.phone || "",
                  address: existingProfile.address || "",
                  city: existingProfile.city || "",
                  state: existingProfile.state || "",
                  pincode: existingProfile.pincode || "",
                  isVerified: existingProfile.verification_status === "verified",
                  verificationStatus: existingProfile.verification_status || "pending",
                },
              });
            }
          })
          .catch((err) => console.warn("Could not fetch profile from backend:", err));
      },

      addCredential: (credential) =>
        set((state) => ({
          credentials: [...state.credentials, credential],
          receivedLog: [
            ...state.receivedLog,
            {
              ...credential,
              receivedAt: Date.now(),
              status: "accepted",
            },
          ],
        })),

      addIssuedCredential: (credential) =>
        set((state) => ({
          issuedCredentials: [...state.issuedCredentials, credential],
        })),

      removeIssuedCredential: (index) =>
        set((state) => ({
          issuedCredentials: state.issuedCredentials.filter((_, i) => i !== index),
        })),

      reset: () =>
        set({
          role: null,
          did: null,
          recoveryPhrase: null,
          credentials: [],
          issuedCredentials: [],
          receivedLog: [],
          isInitialized: false,
          profile: {
            name: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            isVerified: false,
            verificationStatus: "pending",
          },
          enterpriseProfile: {
            name: "",
          },
          language: "en",
          isEnterpriseVerified: false,
          enterpriseVerificationLoading: true,
          walletBalance: null,
          walletBalanceLoading: false,
        }),
    }),
    {
      name: "credchain-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        role: state.role,
        did: state.did,
        credentials: state.credentials,
        issuedCredentials: state.issuedCredentials,
        receivedLog: state.receivedLog,
        isInitialized: state.isInitialized,
        profile: state.profile,
        enterpriseProfile: state.enterpriseProfile,
        language: state.language,
        isEnterpriseVerified: state.isEnterpriseVerified,
      }),
    },
  ),
);

export default useStore;
