import { apiClient } from '../api/client';
import { Offboarding } from '../types/offboarding';

export interface InitiateOffboardingPayload {
  user_id: number;
  departure_date?: string;
  notes?: string;
}

export interface UpdateOffboardingPayload {
  assets_returned?: boolean;
  access_revoked?: boolean;
  status?: string;
  notes?: string;
}

export const offboardingService = {
  /**
   * Get all offboarding records (Admin / Manager view)
   */
  async getAllOffboarding(): Promise<Offboarding[]> {
    const response = await apiClient.get<Offboarding[]>('/offboarding');
    return response.data;
  },

  /**
   * Get offboarding record for currently logged in employee
   */
  async getMyOffboarding(): Promise<Offboarding | null> {
    try {
      const response = await apiClient.get<Offboarding>('/offboarding/me');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Initiate offboarding process for an employee
   */
  async initiateOffboarding(payload: InitiateOffboardingPayload): Promise<Offboarding> {
    const response = await apiClient.post<Offboarding>('/offboarding', payload);
    return response.data;
  },

  /**
   * Update asset returns, access revocation, or status for an offboarding workflow
   */
  async updateOffboarding(id: number | string, payload: UpdateOffboardingPayload): Promise<Offboarding> {
    const response = await apiClient.patch<Offboarding>(`/offboarding/${id}`, payload);
    return response.data;
  },
};