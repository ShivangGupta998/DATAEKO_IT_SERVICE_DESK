import { apiClient } from '../api/client';
import {
  TicketSummaryReport,
  UserActivityItem,
  PriorityDistributionItem,
  StatusDistributionItem,
} from '../types/report';

export const reportService = {
  /**
   * Get overall tickets summary KPI report
   */
  async getTicketsSummary(): Promise<TicketSummaryReport> {
    const response = await apiClient.get<TicketSummaryReport>('/reports/tickets-summary');
    return response.data;
  },

  /**
   * Get user / technician activity report
   */
  async getUserActivity(): Promise<UserActivityItem[]> {
    const response = await apiClient.get<UserActivityItem[]>('/reports/user-activity');
    return response.data;
  },

  /**
   * Get tickets by priority breakdown
   */
  async getPriorityAnalysis(): Promise<PriorityDistributionItem[]> {
    const response = await apiClient.get<PriorityDistributionItem[]>('/reports/priority-analysis');
    return response.data;
  },

  /**
   * Get tickets by status breakdown
   */
  async getStatusAnalysis(): Promise<StatusDistributionItem[]> {
    const response = await apiClient.get<StatusDistributionItem[]>('/reports/status-analysis');
    return response.data;
  },
};
