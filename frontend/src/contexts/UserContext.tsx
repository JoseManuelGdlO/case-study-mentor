import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserPlan = 'free' | 'monthly' | 'semester' | 'annual';

interface UserContextType {
  plan: UserPlan;
  /** Sincroniza plan y perfil con el servidor (p. ej. tras un pago). */
  refreshPlan: () => Promise<void>;
  isFreeUser: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, refreshUser } = useAuth();
  const plan = (user?.plan as UserPlan | undefined) ?? 'free';

  const refreshPlan = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ plan, refreshPlan, isFreeUser: plan === 'free' }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
