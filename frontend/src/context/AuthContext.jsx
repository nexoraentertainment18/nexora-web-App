import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import queryClient from '../api/queryClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('nexora_token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nexora_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Configure Axios globally
  useEffect(() => {
    // Request Interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          delete config.headers.Authorization;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const isPublicAuthEndpoint = error.config?.url?.match(/\/api\/v1\/auth\/(login|signup|verify|forgot-password|reset-password)/);
        if (error.response && (error.response.status === 401 || error.response.status === 403) && !isPublicAuthEndpoint) {
          console.warn("Session expired or unauthorized. Logging out...");
          logout();
          window.location.href = '/login?tab=signin&expired=true';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  // Check token expiration on mount
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          console.warn("Token expired on startup.");
          logout();
        }
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const updateUser = (updatedUser) => {
    if (updatedUser) {
      localStorage.setItem('nexora_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const login = (jwtToken, userProfile) => {
    localStorage.setItem('nexora_token', jwtToken);
    localStorage.setItem('nexora_user', JSON.stringify(userProfile));
    setToken(jwtToken);
    setUser(userProfile);
  };

  const logout = () => {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  const isAuthenticated = () => {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
