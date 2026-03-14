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

// Create a credential request from worker to enterprise
export async function createCredentialRequest({ workerAddress, enterpriseAddress, message }) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/api/credential-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerAddress, enterpriseAddress, message }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Error creating credential request:', error.message);
    throw error;
  }
}

// Fetch credential requests for enterprise or worker
export async function fetchCredentialRequests({ enterprise, worker }) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const params = new URLSearchParams();
    if (enterprise) params.set('enterprise', enterprise);
    if (worker) params.set('worker', worker);

    const response = await fetch(
      `${API_BASE_URL}/api/credential-requests?${params.toString()}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return [];
  }
}

// Update credential request status (approve/reject)
export async function updateCredentialRequest(id, status) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/api/credential-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Error updating credential request:', error.message);
    throw error;
  }
}

// Save credential to server when enterprise issues one
export async function saveCredentialToServer(credentialData) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/api/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentialData),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Error saving credential to server:', error.message);
    throw error;
  }
}

// Discover workers with filters
export async function discoverWorkers({ city, state, minRating, page = 1, limit = 20 } = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (minRating) params.set('minRating', minRating.toString());
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/discover/workers?${params.toString()}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return { workers: [], total: 0 };
  }
}

// Fetch distinct city/state values for filter dropdowns
export async function fetchDiscoverFilters() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/api/discover/filters`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return { cities: [], states: [] };
  }
}
