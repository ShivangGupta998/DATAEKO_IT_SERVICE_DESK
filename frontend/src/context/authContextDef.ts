import { createContext } from 'react';
import { User, UserCreate } from '../types/auth';

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
