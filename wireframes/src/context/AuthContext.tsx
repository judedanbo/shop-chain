import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Nullable } from '@/types';

export type AuthScreen =
  | 'login'
  | 'register'
  | 'verify'
  | 'forgot'
  | 'reset'
  | 'shopSelect'
  | 'createShop'
  | 'authenticated'
  | 'adminLogin'
  | 'adminDashboard';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

/** Wireframe-compatible shop shape used throughout the app */
export interface AppShop {
  name: string;
  type: string;
  icon?: string;
  logoUrl?: string;
  city?: string;
  branches?: AppBranch[];
}

export interface AppBranch {
  id: string;
  name: string;
  status: string;
}

interface AuthContextValue {
  user: Nullable<UserInfo>;
  authScreen: AuthScreen;
  setAuthScreen: (screen: AuthScreen) => void;
  activeShop: Nullable<AppShop>;
  activeBranch: Nullable<AppBranch>;
  setActiveShop: (shop: Nullable<AppShop>) => void;
  setActiveBranch: (branch: Nullable<AppBranch>) => void;
  login: (user: UserInfo) => void;
  logout: () => void;
  selectShop: (shop: AppShop, branch?: AppBranch | null) => void;
  isAuthenticated: boolean;
  currentRole: string;
  setCurrentRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [user, setUser] = useState<Nullable<UserInfo>>(null);
  const [activeShop, setActiveShop] = useState<Nullable<AppShop>>(null);
  const [activeBranch, setActiveBranch] = useState<Nullable<AppBranch>>(null);
  const [currentRole, setCurrentRole] = useState<string>('owner');

  const login = useCallback((userData: UserInfo) => {
    setUser(userData);
    setAuthScreen('shopSelect');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setActiveShop(null);
    setActiveBranch(null);
    setAuthScreen('login');
  }, []);

  const selectShop = useCallback((shop: AppShop, branch: AppBranch | null = null) => {
    setActiveShop(shop);
    setActiveBranch(branch);
    setAuthScreen('authenticated');
  }, []);

  const isAuthenticated = authScreen === 'authenticated';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authScreen,
      setAuthScreen,
      activeShop,
      activeBranch,
      setActiveShop,
      setActiveBranch,
      login,
      logout,
      selectShop,
      isAuthenticated,
      currentRole,
      setCurrentRole,
    }),
    [user, authScreen, activeShop, activeBranch, login, logout, selectShop, isAuthenticated, currentRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
