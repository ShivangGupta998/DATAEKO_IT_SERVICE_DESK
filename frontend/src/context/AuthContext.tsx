import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { User, UserRole, UserCreate } from '../types/auth';
import { authService } from '../services/AuthService';
import { STORAGE_KEY_TOKEN, STORAGE_KEY_USER, getStoredApiUrl, setStoredApiUrl, parseApiError } from '../api/client';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  roleId: number | null;
  roleName: 'Admin' | 'Manager' | 'Technician' | 'Employee' | 'Guest';
  isAdmin: boolean;
  isManager: boolean;
  isTechnician: boolean;
  isEmployee: boolean;
  canManageTickets: boolean;
  canAssignTickets: boolean;
  canUpdateTickets: boolean;
  canManageAssets: boolean;
  canManageAccessRequests: boolean;
  canManageOffboarding: boolean;
  canManageKB: boolean;
  canViewReports: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  login: (username: string, password: string) => Promise<User>;
  register: (data: UserCreate) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_TOKEN));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendUrl, setBackendUrlState] = useState<string>(getStoredApiUrl());

  const updateBackendUrl = useCallback((url: string) => {
    setStoredApiUrl(url);
    setBackendUrlState(url);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('itsm:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('itsm:unauthorized', handleUnauthorized);
  }, [logout]);

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    const currentToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return null;
    }
    try {
      const res: any = await authService.getProfile();
      const profile = res?.user ? res.user : res;
      setUser(profile);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.warn('Failed to refresh profile:', parseApiError(err).message);
      logout();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [token, refreshProfile]);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const loginRes: any = await authService.login(username, password);
      const accessToken = loginRes.access_token;
      
      localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
      setToken(accessToken);

      let profileUser = loginRes.user;
      if (!profileUser) {
        const profileRes: any = await authService.getProfile();
        profileUser = profileRes?.user ? profileRes.user : profileRes;
      }

      if (profileUser && !profileUser.role && loginRes.role) {
        profileUser.role = loginRes.role;
      }

      setUser(profileUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profileUser));
      return profileUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: UserCreate): Promise<User> => {
    return await authService.register(data);
  }, []);

  const roleId = useMemo(() => {
    if (!user) return null;
    return Number(user.role_id);
  }, [user]);

  const roleName = useMemo((): 'Admin' | 'Manager' | 'Technician' | 'Employee' | 'Guest' => {
    if (!user) return 'Guest';

    const rawUser = user as Record<string, any>;
    const directRole = typeof rawUser.role === 'object' ? rawUser.role?.name : rawUser.role;

    if (directRole && ['Admin', 'Manager', 'Technician', 'Employee'].includes(directRole)) {
      return directRole as 'Admin' | 'Manager' | 'Technician' | 'Employee';
    }

    if (!roleId) return 'Guest';

    switch (roleId) {
      case 1:
      case UserRole.ADMIN:
        return 'Admin';
      case 2:
      case UserRole.MANAGER:
        return 'Manager';
      case 3:
      case UserRole.TECHNICIAN:
        return 'Technician';
      case 4:
      case UserRole.EMPLOYEE:
        return 'Employee';
      default:
        return 'Guest';
    }
  }, [user, roleId]);

  const isAdmin = roleName === 'Admin';
  const isManager = roleName === 'Manager';
  const isTechnician = roleName === 'Technician';
  const isEmployee = roleName === 'Employee';

  const canManageTickets = isAdmin || isManager;
  const canAssignTickets = isAdmin || isManager;
  const canUpdateTickets = isAdmin || isManager || isTechnician;
  const canManageAssets = isAdmin || isManager;
  const canManageAccessRequests = isAdmin || isManager;
  const canManageOffboarding = isAdmin || isManager;
  const canManageKB = isAdmin || isManager || isTechnician;
  const canViewReports = isAdmin || isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roleId,
        roleName,
        isAdmin,
        isManager,
        isTechnician,
        isEmployee,
        canManageTickets,
        canAssignTickets,
        canUpdateTickets,
        canManageAssets,
        canManageAccessRequests,
        canManageOffboarding,
        canManageKB,
        canViewReports,
        isAuthenticated: !isLoading && !!token && !!user,
        isLoading,
        backendUrl,
        setBackendUrl: updateBackendUrl,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};