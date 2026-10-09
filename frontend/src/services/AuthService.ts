import { apiClient, STORAGE_KEY_TOKEN, STORAGE_KEY_USER } from '../api/client';
import { User, LoginResponse, UserCreate } from '../types/auth';

export const authService = {
  /**
   * Log in user using OAuth2 form data or JSON credentials
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', username.trim());
    formData.append('password', password);

    let data: LoginResponse;

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      data = response.data;
    } catch (err: any) {
      if (err.response?.status === 422 || err.response?.status === 400) {
        const jsonResponse = await apiClient.post<LoginResponse>('/auth/login', {
          username: username.trim(),
          password,
        });
        data = jsonResponse.data;
      } else {
        throw err;
      }
    }

    // Save token using the matching storage key expected by client.ts
    if (data.access_token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
      if (data.user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      }
    }

    return data;
  },

  /**
   * Logout user and clear tokens
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
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

  /**
   * Update profile fields (Full Name, Phone Number, Job Title, Timezone, Avatar URL)
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/auth/me', data);
    if (response.data) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.data));
    }
    return response.data;
  },

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};