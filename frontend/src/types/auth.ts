export enum UserRole {
  ADMIN = 1,
  MANAGER = 2,
  TECHNICIAN = 3,
  EMPLOYEE = 4,
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  job_title?: string;
  timezone?: string;
  avatar_url?: string;
  role_id: number;
  department_id?: number;
  department?: string | { id: number; name: string };
  role?: string | { id: number; name: string };
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role_id: number;
  department_id: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: User;
  role?: string | { id: number; name: string };
}