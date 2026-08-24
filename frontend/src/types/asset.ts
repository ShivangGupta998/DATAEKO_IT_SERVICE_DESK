export type AssetStatus = 'Available' | 'Assigned' | 'Under Maintenance' | 'Retired' | string;

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  category?: string;
  model?: string;
  serial_number?: string;
  cost?: number;
  status: AssetStatus;
  assigned_to_id?: number | null;
  assigned_to_name?: string;
  assigned_to?: {
    id: number;
    username: string;
    email: string;
    full_name?: string;
  } | null;
  purchase_date?: string;
  warranty_expiry?: string;
  location?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssetCreate {
  asset_tag: string;
  name: string;
  category?: string;
  model?: string;
  serial_number?: string;
  cost?: number;
  status?: string;
  location?: string;
  notes?: string;
  purchase_date?: string;
  warranty_expiry?: string;
}

export interface AssetUpdate {
  name?: string;
  category?: string;
  model?: string;
  serial_number?: string;
  cost?: number;
  status?: string;
  location?: string;
  notes?: string;
}

export interface AssetAssign {
  assigned_to: number;
  notes?: string;
}