import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { fetchProfile, saveProfile, fetchEnterpriseStatus, createCredentialRequest as apiCreateRequest, fetchCredentialRequests as apiFetchRequests, updateCredentialRequest as apiUpdateRequest, saveCredentialToServer } from "@/utils/api";
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

      // Credential requests
      credentialRequests: [],
      credentialRequestsLoading: false,

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
            role: state.role || '',
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

      // Credential request actions
      fetchCredentialRequests: async (params) => {
        set({ credentialRequestsLoading: true });
        try {
          const requests = await apiFetchRequests(params);
          set({ credentialRequests: requests, credentialRequestsLoading: false });
        } catch {
          set({ credentialRequestsLoading: false });
        }
      },

      createCredentialRequest: async (enterpriseAddress, message) => {
        const state = get();
        const result = await apiCreateRequest({
          workerAddress: state.did,
          enterpriseAddress,
          message,
        });
        // Re-fetch requests
        const requests = await apiFetchRequests({ worker: state.did });
        set({ credentialRequests: requests });
        return result;
      },

      updateCredentialRequestStatus: async (requestId, status) => {
        const result = await apiUpdateRequest(requestId, status);
        const state = get();
        const requests = await apiFetchRequests({ enterprise: state.did });
        set({ credentialRequests: requests });
        return result;
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

      addIssuedCredential: (credential) => {
        set((state) => ({
          issuedCredentials: [...state.issuedCredentials, credential],
        }));

        // Also save to server for discover feature
        const did = get().did;
        if (did) {
          saveCredentialToServer({
            workerAddress: credential.workerDid,
            enterpriseAddress: did,
            platform: credential.claims?.platform || '',
            rating: credential.claims?.rating || 0,
            deliveries: credential.claims?.deliveries || 0,
            years: credential.claims?.years || 0,
            type: credential.claims?.type || 'WorkRating',
            txHash: credential.txHash || null,
            onChain: credential.onChain || false,
          }).catch((err) => console.warn('Failed to save credential to server:', err));
        }
      },

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
          credentialRequests: [],
          credentialRequestsLoading: false,
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
