/**
 * API Service
 * 
 * Handles all communication with the Flask backend.
 * This is the ONLY place where API calls should be made.
 * The app acts as a thin client - no business logic here.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Base URL - CHANGE THIS BASED ON YOUR SETUP:
// - Android emulator: http://10.0.2.2:5000
// - iOS simulator: http://localhost:5000  
// - Physical device: http://<YOUR_COMPUTER_IP>:5000
const API_BASE_URL = 'http://10.0.2.2:5000';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token management
export const TokenService = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await TokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await TokenService.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          const currentRefreshToken = await TokenService.getRefreshToken();
          await TokenService.setTokens(access_token, currentRefreshToken || '');

          // Retry original request
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        }
      } catch {
        // Refresh failed, clear tokens
        await TokenService.clearTokens();
      }
    }

    return Promise.reject(error);
  }
);

// API Response types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  playback_token: string;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface StreamResponse {
  youtube_id: string;
  video_id: string;
  title: string;
  expires_at: number;
}

// API Error type
export interface ApiError {
  error: string;
  message: string;
}

// Auth API
export const AuthAPI = {
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', {
      name,
      email,
      password,
    });
    
    // Store tokens
    await TokenService.setTokens(
      response.data.access_token,
      response.data.refresh_token
    );
    
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    
    // Store tokens
    await TokenService.setTokens(
      response.data.access_token,
      response.data.refresh_token
    );
    
    return response.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      await TokenService.clearTokens();
    }
  },
};

// Video API
export const VideoAPI = {
  async getDashboard(): Promise<{ videos: Video[]; count: number }> {
    const response = await api.get<{ videos: Video[]; count: number }>('/dashboard');
    return response.data;
  },

  async getStreamUrl(videoId: string, playbackToken: string): Promise<StreamResponse> {
    const response = await api.get<StreamResponse>(
      `/video/${videoId}/stream?token=${playbackToken}`
    );
    return response.data;
  },

  async trackWatch(videoId: string, duration: number, completed: boolean): Promise<void> {
    await api.post(`/video/${videoId}/track`, {
      duration,
      completed,
    });
  },
};

export default api;
