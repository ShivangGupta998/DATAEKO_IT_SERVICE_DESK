import { apiClient } from '../api/client';
import { Offboarding, OffboardingCreate, OffboardingUpdate } from '../types/offboarding';

export const offboardingService = {
  /**
   * Get all offboarding cases (Admin / Manager)
   */
  async getAllOffboardings(): Promise<Offboarding[]> {
    const response = await apiClient.get<Offboarding[]>('/offboarding');
    return response.data;
  },

  async getAllOffboarding(): Promise<Offboarding[]> {
    return this.getAllOffboardings();
  },

  /**
   * Get user's offboarding record if any
   */
  async getMyOffboarding(): Promise<Offboarding | null> {
    try {
      // ✅ FIX: Backend returns list[OffboardingResponse], get array and take first item
      const response = await apiClient.get<Offboarding[]>('/offboarding/my');
      return Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null;
    } catch {
      return null;
    }
  },

  /**
   * Get single offboarding record
   */
  async getOffboardingById(id: number | string): Promise<Offboarding> {
    const response = await apiClient.get<Offboarding>(`/offboarding/${id}`);
    return response.data;
  },

  /**
   * Initiate employee offboarding
   */
  async createOffboarding(data: OffboardingCreate): Promise<Offboarding> {
    const response = await apiClient.post<Offboarding>('/offboarding', data);
    return response.data;
  },

  async initiateOffboarding(data: OffboardingCreate): Promise<Offboarding> {
    return this.createOffboarding(data);
  },

  /**
   * Update offboarding progress (assets returned, access revoked, status)
   */
  async updateOffboarding(id: number | string, data: OffboardingUpdate): Promise<Offboarding> {
    const response = await apiClient.patch<Offboarding>(`/offboarding/${id}`, data);
    return response.data;
  },
};