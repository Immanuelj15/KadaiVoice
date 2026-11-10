import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kadaivoice_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [shop, setShop] = useState(() => {
    const saved = localStorage.getItem('kadaivoice_shop');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('kadaivoice_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            setShop(res.data.shop);
            localStorage.setItem('kadaivoice_user', JSON.stringify(res.data.user));
            localStorage.setItem('kadaivoice_shop', JSON.stringify(res.data.shop));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await authAPI.login({ identifier, password });
    if (res.data.success) {
      const { token: newToken, user: newUser, shop: newShop } = res.data;
      setToken(newToken);
      setUser(newUser);
      setShop(newShop);
      localStorage.setItem('kadaivoice_token', newToken);
      localStorage.setItem('kadaivoice_user', JSON.stringify(newUser));
      localStorage.setItem('kadaivoice_shop', JSON.stringify(newShop));
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    if (res.data.success) {
      const { token: newToken, user: newUser, shop: newShop } = res.data;
      setToken(newToken);
      setUser(newUser);
      setShop(newShop);
      localStorage.setItem('kadaivoice_token', newToken);
      localStorage.setItem('kadaivoice_user', JSON.stringify(newUser));
      localStorage.setItem('kadaivoice_shop', JSON.stringify(newShop));
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setShop(null);
    localStorage.removeItem('kadaivoice_token');
    localStorage.removeItem('kadaivoice_user');
    localStorage.removeItem('kadaivoice_shop');
  };

  const updateShop = (updatedShop) => {
    setShop(updatedShop);
    localStorage.setItem('kadaivoice_shop', JSON.stringify(updatedShop));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        updateShop,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

