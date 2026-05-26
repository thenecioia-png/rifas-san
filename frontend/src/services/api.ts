import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken } = response.data.data;
        useAuthStore.getState().setAccessToken(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 errors
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle 429 rate limiting
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please try again later.');
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    documentId?: string;
    dateOfBirth?: string;
  }) => api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
  
  getSessions: () => api.get('/auth/sessions'),
};

// Raffles API
export const rafflesApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/raffles', { params }),
  
  getById: (id: string) => api.get(`/raffles/${id}`),
  
  create: (data: any) => api.post('/raffles', data),
  
  reserveTickets: (raffleId: string, ticketNumbers: number[]) =>
    api.post(`/raffles/${raffleId}/reserve`, { ticketNumbers }),
  
  getMyTickets: () => api.get('/raffles/my/tickets'),
  
  drawWinner: (raffleId: string) => api.post(`/raffles/${raffleId}/draw`),
};

// SAN API
export const sanApi = {
  getGroups: () => api.get('/san/groups'),
  
  getGroupDetails: (id: string) => api.get(`/san/groups/${id}`),
  
  joinGroup: (id: string) => api.post(`/san/groups/${id}/join`),
  
  getMyGroups: () => api.get('/san/my-groups'),
  
  recordPayment: (data: any) => api.post('/san/payments', data),
  
  getLatePayments: () => api.get('/san/late-payments'),
};

// Payments API
export const paymentsApi = {
  create: (data: any) => api.post('/payments', data),
  
  getHistory: (params?: { status?: string; method?: string }) =>
    api.get('/payments/history', { params }),
  
  getStats: () => api.get('/payments/stats'),
};

// Wallet API
export const walletApi = {
  getWallet: () => api.get('/wallet'),
  
  deposit: (amount: number, description?: string) =>
    api.post('/wallet/deposit', { amount, description }),
  
  withdraw: (amount: number, description?: string) =>
    api.post('/wallet/withdraw', { amount, description }),
  
  getTransactions: (page?: number, limit?: number) =>
    api.get('/wallet/transactions', { params: { page, limit } }),
};

// Admin API
export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  getUserStats: () => api.get('/admin/users/stats'),
  
  getRevenueReport: (period?: string) =>
    api.get('/admin/revenue', { params: { period } }),
};

// Users API
export const usersApi = {
  getMe: () => api.get('/users/me'),
  
  updateMe: (data: any) => api.put('/users/me', data),
  
  getAll: (params?: any) => api.get('/users', { params }),
  
  getById: (id: string) => api.get(`/users/${id}`),
  
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
  
  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/users/${id}/status`, { status, reason }),
};
