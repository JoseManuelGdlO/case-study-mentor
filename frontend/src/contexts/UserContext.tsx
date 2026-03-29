import { createContext, useContext, useState, ReactNode } from 'react';

export type UserPlan = 'free' | 'monthly' | 'semester' | 'annual';

interface UserContextType {
  plan: UserPlan;
  setPlan: (plan: UserPlan) => void;
  isFreeUser: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [plan, setPlan] = useState<UserPlan>('free');

  return (
    <UserContext.Provider value={{ plan, setPlan, isFreeUser: plan === 'free' }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
