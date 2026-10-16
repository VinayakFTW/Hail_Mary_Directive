export type UserRole = 'ADMIN' | 'MC' | 'ASS';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'ADMIN',
  MC: 'Mission Control',
  ASS: 'Astronaut',
};

export const getRoleDisplay = (role?: UserRole | string): string => {
  if (role === 'MC') return 'Mission Control';
  if (role === 'ASS') return 'Astronaut';
  if (role === 'ADMIN') return 'ADMIN';
  return role || '';
};

export interface User {
  user_id?: number;
  id?: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  session_id?: number | null;
}

export interface GameSession {
  session_id: number;
  is_active: boolean;
  token_found: boolean;
  users: string[];
  created_at?: string;
}

export interface ChatMessage {
  id?: number;
  session_id: number;
  user_mail?: string;
  original_message: string;
  delivered_message?: string;
  created_at?: string;
  tampered?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export type ViewTab = 'dashboard' | 'comms' | 'audit';
