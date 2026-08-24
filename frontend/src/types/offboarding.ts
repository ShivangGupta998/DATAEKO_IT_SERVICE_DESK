export type OffboardingStatus = 'Initiated' | 'In Progress' | 'Assets Returned' | 'Access Revoked' | 'Completed' | string;

export interface Offboarding {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    full_name?: string;
  };
  departure_date: string;
  status: OffboardingStatus;
  assets_returned: boolean;
  access_revoked: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface OffboardingCreate {
  user_id: number;
  departure_date: string;
  notes?: string;
}

export interface OffboardingUpdate {
  status?: OffboardingStatus;
  assets_returned?: boolean;
  access_revoked?: boolean;
  notes?: string;
}
