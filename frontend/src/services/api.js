import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear the stored token so the user is shown the login screen
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Reload the page so AuthContext re-reads the now-empty localStorage
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Storage Items API
export const storageItemsApi = {
  // Get all storage items with pagination
  getStorageItems: async (page = 1, limit = 20, category = null) => {
    const params = { page, limit };
    if (category) params.category = category;
    
    const response = await api.get('/storage-items', { params });
    return response.data;
  },

  // Get storage item by ID
  getStorageItem: async (id) => {
    const response = await api.get(`/storage-items/${id}`);
    return response.data;
  },

  // Create new storage item
  createStorageItem: async (item) => {
    const response = await api.post('/storage-items', item);
    return response.data;
  },

  // Update storage item
  updateStorageItem: async (id, updates) => {
    const response = await api.put(`/storage-items/${id}`, updates);
    return response.data;
  },

  // Delete storage item
  deleteStorageItem: async (id) => {
    await api.delete(`/storage-items/${id}`);
  },
};

// Authentication API
export const authApi = {
  // Get login URL for Entra ID — requires a PKCE code_challenge
  getLoginUrl: async (code_challenge) => {
    const response = await api.get('/auth/login-url', { params: { code_challenge } });
    return response.data;
  },

  // Handle auth callback — requires the PKCE code_verifier that matches the challenge
  handleCallback: async (code, code_verifier) => {
    const response = await api.post('/auth/callback', { code, code_verifier });
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// S3 — Environment discovery
export const s3EnvironmentsApi = {
  // Returns { environments: [{ name: "DEV/TEST" }, ...] }
  listEnvironments: async () => {
    const response = await api.get('/s3/environments');
    return response.data;
  },
};

// S3 User Management API
export const s3UsersApi = {
  // List all S3 users for a given environment (also refreshes from NetApp).
  // Returns { data: [...] }
  listUsers: async (environment) => {
    const response = await api.get('/s3/users', { params: { environment } });
    return response.data;
  },

  // Create a new S3 user via the NetApp SVM API.
  // Returns the user record including the one-time secret_key.
  createUser: async (environment, username, comment) => {
    const body = { environment, username };
    if (comment) body.comment = comment;
    const response = await api.post('/s3/users', body);
    return response.data;
  },

  // Delete an existing S3 user natively from the SVM
  deleteUser: async (environment, username) => {
    const encEnv = encodeURIComponent(environment);
    const encUser = encodeURIComponent(username);
    const response = await api.delete(`/s3/users/${encUser}?environment=${encEnv}`);
    return response.data;
  },
};

// S3 Bucket Management API
export const s3BucketsApi = {
  // Create a new S3 bucket via the NetApp SVM API.
  createBucket: async (environment, name) => {
    const response = await api.post('/s3/buckets', { environment, name });
    return response.data;
  },

  // List asynchronously tracked buckets
  listBuckets: async (environment) => {
    const response = await api.get('/s3/buckets', { params: { environment } });
    return response.data;
  },

  // Proxy fetch granular JSON payload
  getBucketDetails: async (environment, bucketUuid) => {
    const encEnv = encodeURIComponent(environment);
    const encUuid = encodeURIComponent(bucketUuid);
    const response = await api.get(`/s3/buckets/${encUuid}?environment=${encEnv}`);
    return response.data;
  },

  // Delete bucket natively from SVM utilizing bucket_uuid
  deleteBucket: async (environment, bucketUuid) => {
    const encEnv = encodeURIComponent(environment);
    const encUuid = encodeURIComponent(bucketUuid);
    const response = await api.delete(`/s3/buckets/${encUuid}?environment=${encEnv}`);
    return response.data;
  },
};

export default api;