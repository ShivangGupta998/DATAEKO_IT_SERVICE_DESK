export interface TicketSummaryReport {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  critical_tickets?: number;
  sla_breached?: number;
  sla_at_risk?: number;
  sla_compliance_rate?: number;
  avg_resolution_time_hours?: number;
  average_csat?: number;
  total_csat?: number;
}

export interface CsatRatingItem {
  stars: number;
  count: number;
  label: string;
}

export interface CsatFeedbackItem {
  ticket_id: number;
  title: string;
  rating: number;
  feedback?: string;
  submitted_at?: string;
  requester_name?: string;
  assignee_name?: string;
}

export interface CsatAnalysisReport {
  average_csat: number;
  total_responses: number;
  satisfaction_rate: number;
  rating_breakdown: CsatRatingItem[];
  recent_feedback: CsatFeedbackItem[];
}

export interface StatusDistributionItem {
  status: string;
  count: number;
}

export type StatusReportItem = StatusDistributionItem;

export interface PriorityDistributionItem {
  priority: string;
  count: number;
}

export type PriorityReportItem = PriorityDistributionItem;

export interface UserActivityItem {
  user_id?: number;
  username?: string;
  full_name?: string;
  role?: string;
  ticket_count?: number;
  assigned_count?: number;
  resolved_count?: number;
  tickets_created?: number;
  tickets_assigned?: number;
  tickets_resolved?: number;
  last_active?: string;
}
