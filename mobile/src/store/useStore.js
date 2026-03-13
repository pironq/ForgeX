import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { fetchProfile, saveProfile } from "@/utils/api";

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

      initializeWallet: async (phrase, address, privateKey) => {
        await SecureStore.setItemAsync("wallet_phrase", phrase);
        if (privateKey) {
          await SecureStore.setItemAsync("wallet_private_key", privateKey);
        }

        // Try to fetch existing profile from backend (useful for imports)
        let existingProfile = null;
        try {
          existingProfile = await fetchProfile(address);
        } catch (err) {
          console.warn("Could not fetch profile from backend:", err);
        }

        set({
          recoveryPhrase: phrase,
          did: address,
          isInitialized: true,
          // If profile exists on backend, merge it
          ...(existingProfile && {
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
          }),
        });
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
      }),
    },
  ),
);

export default useStore;
