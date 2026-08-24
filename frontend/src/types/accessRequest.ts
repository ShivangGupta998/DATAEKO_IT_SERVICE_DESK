export type AccessRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Revoked' | string;

export interface AccessRequest {
  id: number;
  system_name: string;
  access_type?: string;
  reason: string;
  status: AccessRequestStatus;
  user_id?: number;
  user_name?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    full_name?: string;
  };
  approved_by_id?: number | null;
  approver_name?: string;
  approver?: {
    id: number;
    username: string;
    full_name?: string;
  } | null;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AccessRequestCreate {
  system_name: string;
  access_type?: string;
  reason: string;
}

export interface AccessRequestUpdate {
  status?: AccessRequestStatus;
  admin_notes?: string;
}
