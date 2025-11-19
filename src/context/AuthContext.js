import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await AuthService.checkSession();
      setIsLoggedIn(res.data.isLoggedIn);
      const userRole = res.data.role || localStorage.getItem("role");
      setRole(userRole);
      if (userRole) localStorage.setItem("role", userRole);
    } catch (err) {
      setIsLoggedIn(false);
      setRole(null);
      localStorage.removeItem("role");
    } finally {
      setLoading(false);
    }
  };

  const login = (userRole) => {
    setIsLoggedIn(true);
    setRole(userRole);
    localStorage.setItem("role", userRole);
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggedIn(false);
      setRole(null);
      localStorage.removeItem("user_id");
      localStorage.removeItem("role");
    }
  };

  const value = {
    isLoggedIn,
    role,
    loading,
    login,
    logout,
    checkSession
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

