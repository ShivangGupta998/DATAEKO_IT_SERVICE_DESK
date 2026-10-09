import { apiClient } from '../api/client';

export interface OnboardUserPayload {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role_id: number;
  department_id?: number;
}

export interface AdminUserItem {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role_id: number;
  role: string;
  department_id?: number;
  department?: string;
  is_active: boolean;
  slack_user_id?: string;
}

export const adminService = {
  createUser: async (payload: OnboardUserPayload): Promise<AdminUserItem> => {
    try {
      const response = await apiClient.post<AdminUserItem>('/api/v1/admin/users', payload);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await apiClient.post<AdminUserItem>('/admin/users', payload);
        return fallback.data;
      }
      throw err;
    }
  },

  getUsers: async (): Promise<AdminUserItem[]> => {
    try {
      const response = await apiClient.get<AdminUserItem[]>('/api/v1/admin/users');
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await apiClient.get<AdminUserItem[]>('/admin/users');
        return fallback.data;
      }
      throw err;
    }
  },

  getDepartments: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const response = await apiClient.get<{ id: number; name: string }[]>('/api/v1/admin/departments');
      return response.data;
    } catch {
      return [
        { id: 1, name: 'IT' },
        { id: 2, name: 'HR' },
        { id: 3, name: 'Finance' },
        { id: 4, name: 'Operations' },
      ];
    }
  },

  getRoles: async (): Promise<{ id: number; name: string; description?: string }[]> => {
    try {
      const response = await apiClient.get<{ id: number; name: string; description?: string }[]>('/api/v1/admin/roles');
      return response.data;
    } catch {
      return [
        { id: 1, name: 'Admin', description: 'System Administrator' },
        { id: 2, name: 'Manager', description: 'Department Manager' },
        { id: 3, name: 'Technician', description: 'Support Technician' },
        { id: 4, name: 'Employee', description: 'Standard Employee' },
      ];
    }
  },
};
