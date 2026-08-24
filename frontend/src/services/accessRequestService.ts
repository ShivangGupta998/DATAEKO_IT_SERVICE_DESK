import { apiClient } from '../api/client';
import { AccessRequest, AccessRequestCreate, AccessRequestUpdate } from '../types/accessRequest';

export const accessRequestService = {
  /**
   * Get all access requests across the organization (Admin / Manager)
   */
  async getAllRequests(): Promise<AccessRequest[]> {
    const response = await apiClient.get<AccessRequest[]>('/access-requests');
    return response.data;
  },

  /**
   * Get access requests created by current user
   */
  async getMyRequests(): Promise<AccessRequest[]> {
    const response = await apiClient.get<AccessRequest[]>('/access-requests/my');
    return response.data;
  },

  /**
   * Get a single access request by ID
   */
  async getRequestById(requestId: number | string): Promise<AccessRequest> {
    const response = await apiClient.get<AccessRequest>(`/access-requests/${requestId}`);
    return response.data;
  },

  /**
   * Create a new access request
   */
  async createRequest(data: AccessRequestCreate): Promise<AccessRequest> {
    const response = await apiClient.post<AccessRequest>('/access-requests', data);
    return response.data;
  },

  /**
   * Update / Approve / Reject an access request
   */
  async updateRequest(requestId: number | string, data: AccessRequestUpdate): Promise<AccessRequest> {
    const response = await apiClient.patch<AccessRequest>(`/access-requests/${requestId}`, data);
    return response.data;
  },
};
