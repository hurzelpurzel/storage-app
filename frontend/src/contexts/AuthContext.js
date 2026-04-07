import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username'));
  const [ready, setReady] = useState(false); // true once the status check is done

  const login = useCallback((newToken, newUsername) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (newUsername) {
      localStorage.setItem('username', newUsername);
      setUsername(newUsername);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
  }, []);

  // On first load, ask the backend whether auth is enabled.
  // If not, it hands back a dev-user token immediately — no redirect needed.
  useEffect(() => {
    // Skip if we already have a valid-looking token in storage
    if (localStorage.getItem('token')) {
      setReady(true);
      return;
    }

    axios.get('/api/auth/status')
      .then(({ data }) => {
        if (!data.auth_enabled && data.access_token) {
          login(data.access_token, data.dev_user);
        }
      })
      .catch(() => { /* network error — leave unauthenticated */ })
      .finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isAuthenticated = Boolean(token);

  // Don't render children until the status check has completed, to avoid
  // a flash of the LoginPage before the dev token is set.
  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ token, username, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
