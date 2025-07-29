// ============================================================================
// API TYPES - Definiciones centralizadas para el frontend
// ============================================================================

// Base types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// USER & PROFILE TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  email_verified: boolean
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
}

export interface Profile {
  id: string
  user_id: string
  username?: string
  full_name?: string
  avatar_url?: string
  bio?: string
  website?: string
  location?: string
  phone?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  timezone?: string
  language?: string
  theme?: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

export interface ProfileUpdatePayload {
  username?: string
  full_name?: string
  avatar_url?: string
  bio?: string
  website?: string
  location?: string
  phone?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  timezone?: string
  language?: string
  theme?: 'light' | 'dark' | 'system'
}

// ============================================================================
// NOTIFICATIONS TYPES
// ============================================================================

export interface NotificationSettings {
  id: string
  user_id: string
  type: 'all' | 'mentions' | 'none'
  mobile: boolean
  communication_emails: boolean
  social_emails: boolean
  marketing_emails: boolean
  security_emails: boolean
  created_at: string
  updated_at: string
}

export interface NotificationSettingsUpdatePayload {
  type?: 'all' | 'mentions' | 'none'
  mobile?: boolean
  communication_emails?: boolean
  social_emails?: boolean
  marketing_emails?: boolean
  security_emails?: boolean
}

// ============================================================================
// AGENTS & KNOWLEDGE TYPES
// ============================================================================

export interface Agent {
  id: string
  user_id: string
  name: string
  description?: string
  template: 'receptor' | 'vendedor' | 'soporte' | 'custom'
  config: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Knowledge {
  id: string
  user_id: string
  name: string
  type: 'pdf' | 'text' | 'doc' | 'link' | 'url'
  content?: string
  url?: string
  file_path?: string
  size?: number
  metadata: Record<string, any>
  agent_ids: string[]
  created_at: string
  updated_at: string
}

// ============================================================================
// CONVERSATIONS TYPES
// ============================================================================

export interface Conversation {
  id: string
  user_id: string
  agent_id: string
  title: string
  status: 'active' | 'archived' | 'deleted'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  last_message_at?: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, any>
  created_at: string
}

// ============================================================================
// QUERY KEYS - Para TanStack Query
// ============================================================================

export const QueryKeys = {
  // Profile
  profile: ['profile'] as const,
  profileById: (id: string) => ['profile', id] as const,
  
  // Notifications
  notificationSettings: ['notification-settings'] as const,
  
  // Agents
  agents: ['agents'] as const,
  agentById: (id: string) => ['agents', id] as const,
  
  // Knowledge
  knowledge: ['knowledge'] as const,
  knowledgeById: (id: string) => ['knowledge', id] as const,
  knowledgeByAgent: (agentId: string) => ['knowledge', 'agent', agentId] as const,
  
  // Conversations
  conversations: ['conversations'] as const,
  conversationById: (id: string) => ['conversations', id] as const,
  conversationMessages: (id: string) => ['conversations', id, 'messages'] as const,
} as const

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export class ApiException extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiException'
  }
}
