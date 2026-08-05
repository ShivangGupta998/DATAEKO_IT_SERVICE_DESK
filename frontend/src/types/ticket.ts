export interface Ticket {
  id: number
  title: string
  description: string
  category: string
  priority: string
  status: string
  source: string
  requester_id: number
  assignee_id: number | null
  created_at: string
  updated_at: string
}