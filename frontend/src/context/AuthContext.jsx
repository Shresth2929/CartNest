import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const saved = localStorage.getItem('cartnest_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem('cartnest_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('cartnest_token'));
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Load and refresh user session on startup
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('cartnest_token');
      if (storedToken) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('cartnest_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          setUser(null);
          setToken(null);
          localStorage.removeItem('cartnest_token');
          localStorage.removeItem('cartnest_user');
        }
      }
      setIsLoading(false);
    }

    initAuth();

    // Listen for auth change events (e.g. 401 interceptor)
    const handleAuthChange = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.auth.login({ email, password });
      if (res.success && res.data) {
        const { user: userData, token: userToken } = res.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('cartnest_token', userToken);
        localStorage.setItem('cartnest_user', JSON.stringify(userData));
        showToast(`Welcome back, ${userData.name}!`, 'success');
        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.auth.register(userData);
      if (res.success && res.data) {
        const { user: newUser, token: userToken } = res.data;
        setUser(newUser);
        setToken(userToken);
        localStorage.setItem('cartnest_token', userToken);
        localStorage.setItem('cartnest_user', JSON.stringify(newUser));
        showToast('Your CartNest account has been created!', 'success');
        return { success: true, user: newUser };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cartnest_token');
    localStorage.removeItem('cartnest_user');
    showToast('You have been logged out.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
