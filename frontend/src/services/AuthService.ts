import { apiClient } from '../api/client';
import { User, LoginResponse, UserCreate } from '../types/auth';

export const authService = {
  /**
   * Log in user using OAuth2 form data or JSON credentials
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', username.trim());
    formData.append('password', password);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 422 || err.response?.status === 400) {
        const jsonResponse = await apiClient.post<LoginResponse>('/auth/login', {
          username: username.trim(),
          password,
        });
        return jsonResponse.data;
      }
      throw err;
    }
  },

  /**
   * Register a new user
   */
  async register(data: UserCreate): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  /**
   * Fetch current authenticated user's profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};