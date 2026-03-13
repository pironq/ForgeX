// API configuration
// For dev: http://localhost:3000
// For production: your deployed server URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Fetch profile from backend
export async function fetchProfile(walletAddress) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/profile?address=${encodeURIComponent(walletAddress)}`
    );

    if (response.status === 404) {
      return null; // Profile doesn't exist yet
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Save profile to backend
export async function saveProfile(profileData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}
