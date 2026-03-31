import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  getProfile,
  setAuthToken,
  clearAuthToken,
  getStoredToken,
  type AuthUser,
} from '@/services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, attempt to restore session from stored token
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    getProfile()
      .then((profile) => setUser(profile))
      .catch(() => clearAuthToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user: profile } = await apiLogin({ email, password });
    setAuthToken(accessToken);
    setUser(profile);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { accessToken, user: profile } = await apiRegister({ name, email, password });
    setAuthToken(accessToken);
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
