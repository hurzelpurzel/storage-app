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
  // Get login URL for Entra ID
  getLoginUrl: async () => {
    const response = await api.get('/auth/login-url');
    return response.data;
  },

  // Handle auth callback
  handleCallback: async (code) => {
    const response = await api.post('/auth/callback', { code });
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
};

export default api;