import { apiClient } from '../api/client';
import { Ticket, TicketCreate, TicketUpdate, TicketHistoryItem, Attachment } from '../types/ticket';

export const ticketService = {
  /**
   * Get all tickets (Admin / Manager)
   */
  async getAllTickets(params?: { status?: string; priority?: string; category?: string; search?: string }): Promise<Ticket[]> {
    const response = await apiClient.get<Ticket[]>('/tickets/', { params });
    return response.data;
  },

  /**
   * Get tickets created by the logged-in user (Employee)
   */
  async getMyTickets(params?: { status?: string; priority?: string }): Promise<Ticket[]> {
    const response = await apiClient.get<Ticket[]>('/tickets/my', { params });
    return response.data;
  },

  /**
   * Get tickets assigned to the logged-in user (Technician)
   */
  async getAssignedTickets(params?: { status?: string; priority?: string }): Promise<Ticket[]> {
    const response = await apiClient.get<Ticket[]>('/tickets/assigned', { params });
    return response.data;
  },

  /**
   * Get ticket details by ID
   */
  async getTicketById(ticketId: number | string): Promise<Ticket> {
    const response = await apiClient.get<Ticket>(`/tickets/${ticketId}`);
    return response.data;
  },

  /**
   * Get ticket audit history / timeline
   */
  async getTicketHistory(ticketId: number | string): Promise<TicketHistoryItem[]> {
    const response = await apiClient.get<TicketHistoryItem[]>(`/tickets/${ticketId}/history`);
    return response.data;
  },

  /**
   * Create a new ticket
   */
  async createTicket(data: TicketCreate): Promise<Ticket> {
    const response = await apiClient.post<Ticket>('/tickets/', data);
    return response.data;
  },

  /**
   * Upload attachments (screenshots, logs, docs)
   */
  async uploadAttachments(files: File[]): Promise<Attachment[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await apiClient.post<Attachment[]>('/tickets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update ticket (status, priority, assignee_id, comment, etc.)
   * Note: Assignment is done via PATCH /tickets/{id} with assignee_id
   */
  async updateTicket(ticketId: number | string, data: TicketUpdate): Promise<Ticket> {
    const response = await apiClient.patch<Ticket>(`/tickets/${ticketId}`, data);
    return response.data;
  },

  /**
   * Submit Customer Satisfaction (CSAT) rating & feedback
   */
  async submitCsat(
    ticketId: number | string,
    data: { rating: number; feedback?: string }
  ): Promise<Ticket> {
    const response = await apiClient.post<Ticket>(`/tickets/${ticketId}/csat`, data);
    return response.data;
  },
};