export type UserStatus = 
  | 'active' 
  | 'blocked' 
  | 'pending' 
  | 'suspended' 
  | 'inactive';

export type ResolutionType = 'normalize' | 'suspicious';

export type ResolutionPriority = 'low' | 'mid' | 'high';

export interface ResolutionData {
  type: ResolutionType;
  priority: ResolutionPriority;
}

// Mantido para compatibilidade
export type ResolutionStatus = 
  | 'pending' 
  | 'in_review' 
  | 'resolved_suspicious' 
  | 'resolved_clean' 
  | 'escalated';

export type HighValue = 'yes' | 'no';

export interface AMLCase {
  user_id: number;
  created_at: string;
  analyst: string;
  days_since_creation: number;
  status: UserStatus;
  high_value: HighValue;
  resolution_status?: ResolutionStatus;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export interface CaseResolution {
  case_id: number;
  type: ResolutionType;
  priority: ResolutionPriority;
  notes: string;
  resolved_by: string;
}

export type SortField = 'created_at' | 'days_since_creation' | 'user_id';
export type SortOrder = 'asc' | 'desc';

export interface CaseFilters {
  search: string;
  status: UserStatus | 'all';
  high_value: HighValue | 'all';
  analyst: string | 'all';
  days_range: [number, number] | null;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface CaseStats {
  total: number;
  pending: number;
  in_review: number;
  resolved: number;
  high_value_count: number;
  avg_days_pending: number;
}

export interface UserInfo {
  endereco: string | null;
  id_cliente: number;
  nome: string | null;
  merchant_name: string | null;
  email: string | null;
  idade: number | null;
  status: string | null;
  status_reason: string | null;
  role_type: string;
  categoria_negocio: string;
  document_number: string;
  created_at_ch: string | null;
  created_at_me: string | null;
  cidade: string | null;
  estado: string | null;
}

