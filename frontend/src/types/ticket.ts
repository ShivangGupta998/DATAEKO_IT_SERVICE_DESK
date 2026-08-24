export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | string;
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical' | string;
export type TicketCategory = 'Hardware' | 'Software' | 'Network' | 'Access' | 'Security' | 'General' | string;

export interface SLAInfo {
  status?: 'Within SLA' | 'At Risk' | 'Breached' | 'Met' | string;
  target_hours?: number;
  target_resolution_time?: string;
  breach_time?: string;
  remaining_minutes?: number;
  remaining_time?: string;
  is_breached?: boolean;
  due_date?: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category?: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requester_id?: number;
  requester_name?: string;
  requester_email?: string;
  requester?: {
    id: number;
    username: string;
    email: string;
    full_name?: string;
  };
  assignee_id?: number | null;
  assignee_name?: string;
  assignee?: {
    id: number;
    username: string;
    email: string;
    full_name?: string;
  } | null;
  source?: string;
  sla_status?: string;
  sla_target?: string;
  sla_due_date?: string;
  remaining_minutes?: number;
  sla?: SLAInfo;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
}

export interface TicketCreate {
  title: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
  source?: string;
}

export interface TicketUpdate {
  title?: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignee_id?: number | null;
  comment?: string;
}

export interface TicketHistoryItem {
  id: number;
  ticket_id: number;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  action?: string;
  comment?: string;
  changed_by_id?: number;
  changed_by_name?: string;
  created_at: string;
  user?: {
    id: number;
    username: string;
    full_name?: string;
  };
}
