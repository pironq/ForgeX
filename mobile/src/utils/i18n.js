// Translation utility for Hindi/English support

export const translations = {
  en: {
    // Common
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    continue: "Continue",
    logout: "LOGOUT",

    // Profile
    profile: "Profile",
    editProfile: "Edit Profile",
    personalInfo: "Personal Information",
    name: "Full Name",
    phone: "Phone Number",
    address: "Address",
    city: "City",
    state: "State",
    pincode: "Pincode",

    // Identity Verification
    verifyIdentity: "Verify Identity",
    verificationStatus: "Verification Status",
    pending: "Pending",
    inProgress: "In Progress",
    verified: "Verified",
    rejected: "Rejected",
    uploadDocument: "Upload Government Document",
    documentTypes: "Aadhaar, PAN, Driving License, or Voter ID",

    // Settings
    accountSecurity: "Account & Security",
    backupRecovery: "Backup Recovery Phrase",
    securityCenter: "Security Center",
    appPreferences: "App Preferences",
    language: "Language",
    switchView: "Switch View",

    // Credentials
    myCredentials: "My Credentials",
    receiveCredential: "Receive Credential",
    totalCredentials: "Total Credentials",
    avgRating: "Avg Rating",
    platforms: "Platforms",

    // Worker
    gigWorker: "Gig Worker",
    worker: "Worker",

    // Enterprise
    enterprise: "Enterprise",
    issueCredential: "Issue Credential",
    myWorkers: "My Workers",
    verify: "Verify",

    // Wallet
    walletAddress: "Wallet Address",
    didAddress: "DID Address",

    // Alerts
    logoutConfirm:
      "This will clear your local wallet and credentials. Make sure you have your recovery phrase!",
    logoutTitle: "Log Out",
  },
  hi: {
    // Common
    save: "सहेजें",
    cancel: "रद्द करें",
    back: "वापस",
    continue: "जारी रखें",
    logout: "लॉगआउट",

    // Profile
    profile: "प्रोफ़ाइल",
    editProfile: "प्रोफ़ाइल संपादित करें",
    personalInfo: "व्यक्तिगत जानकारी",
    name: "पूरा नाम",
    phone: "फ़ोन नंबर",
    address: "पता",
    city: "शहर",
    state: "राज्य",
    pincode: "पिनकोड",

    // Identity Verification
    verifyIdentity: "पहचान सत्यापित करें",
    verificationStatus: "सत्यापन स्थिति",
    pending: "लंबित",
    inProgress: "प्रगति में",
    verified: "सत्यापित",
    rejected: "अस्वीकृत",
    uploadDocument: "सरकारी दस्तावेज़ अपलोड करें",
    documentTypes: "आधार, पैन, ड्राइविंग लाइसेंस, या वोटर आईडी",

    // Settings
    accountSecurity: "खाता और सुरक्षा",
    backupRecovery: "बैकअप रिकवरी वाक्यांश",
    securityCenter: "सुरक्षा केंद्र",
    appPreferences: "ऐप प्राथमिकताएं",
    language: "भाषा",
    switchView: "दृश्य बदलें",

    // Credentials
    myCredentials: "मेरे क्रेडेंशियल",
    receiveCredential: "क्रेडेंशियल प्राप्त करें",
    totalCredentials: "कुल क्रेडेंशियल",
    avgRating: "औसत रेटिंग",
    platforms: "प्लेटफ़ॉर्म",

    // Worker
    gigWorker: "गिग वर्कर",
    worker: "वर्कर",

    // Enterprise
    enterprise: "एंटरप्राइज़",
    issueCredential: "क्रेडेंशियल जारी करें",
    myWorkers: "मेरे वर्कर",
    verify: "सत्यापित करें",

    // Wallet
    walletAddress: "वॉलेट पता",
    didAddress: "DID पता",

    // Alerts
    logoutConfirm:
      "यह आपके स्थानीय वॉलेट और क्रेडेंशियल को साफ़ कर देगा। सुनिश्चित करें कि आपके पास अपना रिकवरी वाक्यांश है!",
    logoutTitle: "लॉग आउट",
  },
};

export const useTranslation = (language = "en") => {
  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return { t };
};
