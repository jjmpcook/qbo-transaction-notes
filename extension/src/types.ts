export interface NotePayload {
  transaction_url: string;
  transaction_id: string;
  transaction_type: string;
  date: string;
  amount: number;
  customer_vendor: string;
  invoice_number: string;
  note: string;
  created_by: string;
}

export interface TransactionData {
  transaction_url: string;
  transaction_id: string | null;
  transaction_type: string;
  date: string | null;
  amount: number | null;
  customer_vendor: string | null;
  invoice_number: string | null;
  created_by: string | null;
}

export interface NoteResponse {
  id: string;
  success: boolean;
}

export interface ApiError {
  error: string;
  details?: string;
}

// Authentication types
export interface SubscriptionResponse {
  valid: boolean;
  plan: string;
  userId: string;
}

export interface AuthCache {
  isValid: boolean;
  plan: string;
  userId: string;
  timestamp: number;
  userEmail: string;
}

export interface UserCredentials {
  email: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface AuthStatus {
  isValid: boolean;
  plan?: string;
  userId?: string;
}