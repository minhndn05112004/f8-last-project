import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/axios';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000/chat';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      // Let interceptor handle it
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      fetchProfile();
    } else {
      setLoading(false);
    }
    
    // Listen for forced logout from interceptor
    const handleLogout = () => logout(false);
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    }
  }, [fetchProfile]);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user && !socket) {
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        setConnected(true);
        newSocket.emit('authenticate', { userId: user.id, role: user.role });
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setConnected(false);
      };
    } else if (!user && socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    // Don't auto-login here as email verification is required
    return res.data;
  };

  const logout = async (callApi = true) => {
    if (callApi) {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await api.post('/auth/logout', { refreshToken });
        }
      } catch (err) {
        console.error('Error logging out on backend', err);
      }
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token'); // cleanup old token
    setUser(null);
    if (socket) socket.close();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, socket, connected }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
