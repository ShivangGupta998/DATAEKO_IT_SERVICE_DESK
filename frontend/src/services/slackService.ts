import { apiClient } from '../api/client';

export const slackService = {
  async getHealth(): Promise<{ status: string; details?: any }> {
    const response = await apiClient.get('/slack/health');
    return response.data;
  },

  async sendTestNotification(): Promise<{ status: string; message?: string }> {
    const response = await apiClient.get('/slack/test-notification');
    return response.data;
  },
};
