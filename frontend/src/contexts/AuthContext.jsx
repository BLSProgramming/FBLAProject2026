import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AuthContext = createContext();

/**
 * Centralised authentication provider.
 *
 * Exposes:
 *  - user        { userId, userType, token } | null
 *  - isAuthenticated   boolean
 *  - login(data) – persist credentials from API response
 *  - logout()    – clear credentials and redirect to /login
 */
export function AuthProvider({ children }) {
  // Initialise from localStorage once
  const [user, setUser] = useState(() => {
    try {
      const userId = localStorage.getItem('userId');
      const userType = localStorage.getItem('userType');
      const token = localStorage.getItem('token');
      if (userId) return { userId, userType, token };
    } catch {
      /* SSR-safe */
    }
    return null;
  });

  const login = useCallback((data) => {
    const userId = String(data.id ?? data.userId ?? '');
    const userType = data.userType ?? '';
    const token = data.token ?? '';

    if (userId) localStorage.setItem('userId', userId);
    if (userType) localStorage.setItem('userType', userType);
    if (token) localStorage.setItem('token', token);

    setUser({ userId, userType, token });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user?.userId);

  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout }),
    [user, isAuthenticated, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
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
