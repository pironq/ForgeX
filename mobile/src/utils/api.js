// API configuration
// For dev: http://localhost:3000
// For production: your deployed server URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Fetch profile from backend
export async function fetchProfile(walletAddress) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(
      `${API_BASE_URL}/api/profile?address=${encodeURIComponent(walletAddress)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (response.status === 404) {
      return null; // Profile doesn't exist yet
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Silent fail — profile fetch is non-critical
    return null;
  }
}

// Save profile to backend
export async function saveProfile(profileData) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Error saving profile:', error.message);
    throw error;
  }
}

// Check enterprise verification status
export async function fetchEnterpriseStatus(walletAddress) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(
      `${API_BASE_URL}/api/enterprise/verify?address=${encodeURIComponent(walletAddress)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Silent fail — enterprise check is non-critical, defaults to locked
    return { verified: false, enterpriseName: null };
  }
}
