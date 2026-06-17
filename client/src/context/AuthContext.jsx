import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('luminosUser');
    return u ? JSON.parse(u) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      if (data.require2FA) {
        return { success: true, require2FA: true, username: data.username };
      }
      localStorage.setItem('luminosToken', data.token);
      localStorage.setItem('luminosUser', JSON.stringify({ username: data.username, role: data.role }));
      setUser({ username: data.username, role: data.role });
      return { success: true, role: data.role };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (username, code) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-2fa', { username, code });
      localStorage.setItem('luminosToken', data.token);
      localStorage.setItem('luminosUser', JSON.stringify({ username: data.username, role: data.role }));
      setUser({ username: data.username, role: data.role });
      return { success: true, role: data.role };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || '2FA code verification failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password, email, phone, fullName) => {
    setLoading(true);
    try {
      await api.post('/auth/register', { username, password, email, phone, fullName });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (newUsername, newToken) => {
    localStorage.setItem('luminosToken', newToken);
    localStorage.setItem('luminosUser', JSON.stringify({ username: newUsername, role: user?.role }));
    setUser({ username: newUsername, role: user?.role });
  };

  const logout = () => {
    localStorage.removeItem('luminosToken');
    localStorage.removeItem('luminosUser');
    setUser(null);
  };

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          logout();
        }
        return Promise.reject(err);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, verify2FA, register, logout, updateUser, loading, isAdmin: user?.role === 'admin', isCustomer: user?.role === 'customer' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
