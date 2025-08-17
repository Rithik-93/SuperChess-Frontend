import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import type { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3000';

axios.defaults.withCredentials = true;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (originalRequest.url?.includes('/refresh')) {
          return Promise.reject(error);
        }
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const cookies = document.cookie.split(';');
            let refreshToken = '';
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === 'refreshToken') {
                refreshToken = value;
                break;
              }
            }
            
            if (!refreshToken) {
              throw new Error('No refresh token found');
            }
            
            const response = await axios.post(`${API_BASE_URL}/refresh`, {}, {
              headers: {
                'Authorization': `Bearer ${refreshToken}`
              }
            });
            
            if (response.status === 200) {
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            setUser(null);
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
        console.log('Token refreshed proactively');
      } catch (err) {
        console.error('Proactive token refresh failed:', err);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/me`);
      setUser(response.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/login`, {
        email,
        password,
      });
      setUser(response.data.user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/signup`, {
        email,
        password,
      });
      setUser(response.data.user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const cookies = document.cookie.split(';');
      let refreshToken = '';
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'refreshToken') {
          refreshToken = value;
          break;
        }
      }
      
      if (!refreshToken) {
        console.error('No refresh token found in cookies');
        return false;
      }
      
      console.log('Attempting to refresh token with:', refreshToken.substring(0, 20) + '...');
      
      const response = await axios.post(`${API_BASE_URL}/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    refreshToken,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
