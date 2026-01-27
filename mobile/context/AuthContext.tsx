/**
 * Authentication Context
 * 
 * Provides authentication state management across the app.
 * Handles login status, user data, and secure token storage.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthAPI, TokenService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await TokenService.getAccessToken();
      if (token) {
        const response = await AuthAPI.getProfile();
        setUser(response.user);
      }
    } catch {
      // Token invalid or expired
      await TokenService.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const response = await AuthAPI.login(email, password);
    setUser(response.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const response = await AuthAPI.signup(name, email, password);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await AuthAPI.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await AuthAPI.getProfile();
      setUser(response.user);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
