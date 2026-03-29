import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, apiJson } from '@/lib/api';

export type AppRole = 'admin' | 'editor' | 'user';

export type AuthUser = {
  id: string;
  email: string;
  authProvider: 'email' | 'google';
  firstName: string;
  lastName: string;
  university: string | null;
  graduationYear: number | null;
  examDate: string | null;
  avatarUrl: string | null;
  onboardingDone: boolean;
  roles: AppRole[];
  plan?: 'free' | 'monthly' | 'semester' | 'annual';
  subscriptionExpiresAt?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<{ isNewUser: boolean }>;
  logout: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<{ isNewUser: boolean }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch('/api/profile');
      if (!res.ok) {
        setUser(null);
        return;
      }
      const json = (await res.json()) as { data: AuthUser };
      setUser(json.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refreshUser();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    await apiJson<{ data: { user: AuthUser } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await refreshUser();
  }, [refreshUser]);

  const register = useCallback(
    async (data: { email: string; password: string; firstName: string; lastName: string }) => {
      const json = await apiJson<{ data: { user: AuthUser; isNewUser: boolean } }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshUser();
      return { isNewUser: json.data.isNewUser };
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const googleLogin = useCallback(
    async (idToken: string) => {
      const json = await apiJson<{ data: { user: AuthUser; isNewUser: boolean } }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });
      // Usar el usuario de la respuesta de auth: si /api/profile falla (p. ej. cookies cross-origin
      // con SameSite=Lax), refreshUser pondría user=null y ProtectedRoute te devuelve al login.
      setUser(json.data.user);
      const res = await apiFetch('/api/profile');
      if (res.ok) {
        const profile = (await res.json()) as { data: AuthUser };
        setUser(profile.data);
      }
      return { isNewUser: json.data.isNewUser };
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser, refreshUser, login, register, logout, googleLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
