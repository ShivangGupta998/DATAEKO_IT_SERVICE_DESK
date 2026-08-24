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
  role_id: number;
  department_id?: number;
  role?: string | { id: number; name: string };
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role_id: number;
  department_id: number; // Updated from department to department_id
}