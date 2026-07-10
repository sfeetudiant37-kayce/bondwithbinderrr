export type Language = 'en' | 'fr';
export type UserRole = 'client' | 'provider';
export type BudgetRange = 'under_10k' | '10k_30k' | '30k_100k' | 'above_100k';
export type Availability = 'immediate' | 'this_week' | 'flexible' | 'busy';
export type Urgency = 'urgent' | 'this_week' | 'flexible';
export type RequestStatus = 'open' | 'in_progress' | 'completed' | 'archived';
export type MatchStatus = 'provider_interested' | 'client_interested' | 'mutual' | 'contacted' | 'completed' | 'archived';
export type SwipeDirection = 'left' | 'right';
export type NotificationType = 'new_match' | 'new_message' | 'review_received' | 'request_response';
export type Priority = 'high' | 'medium' | 'low';
export type SyncAction = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type AvatarColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  language: Language;
  has_client_profile: boolean;
  has_provider_profile: boolean;
  active_role: UserRole;
  avatar_color: AvatarColor;
  is_dummy: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  location: string;
  quartier: string;
  budget_range: BudgetRange;
  budget_value: number;
  description: string;
  preferences: string[];
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  location: string;
  quartier: string;
  skills: string[];
  price: number;
  availability: Availability;
  experience: number;
  bio: string;
  phone: string;
  whatsapp: string;
  rating: number;
  review_count: number;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  urgency: Urgency;
  required_skills: string[];
  status: RequestStatus;
  accepted_provider_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  target_id: string;
  target_type: 'user' | 'request';
  swiper_role: UserRole;
  direction: SwipeDirection;
  fit_score: number;
  is_synced: boolean;
  is_undone: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  client_id: string;
  provider_id: string;
  request_id: string | null;
  initiated_by: 'client' | 'provider' | 'mutual';
  client_fit_score: number;
  provider_fit_score: number;
  status: MatchStatus;
  contact_revealed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_synced: boolean;
  is_deleted_for_sender: boolean;
  is_deleted_for_everyone: boolean;
  deleted_at: string | null;
  sent_at: string;
}

export interface Review {
  id: string;
  match_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

export interface Weights {
  id: string;
  user_id: string;
  role: UserRole;
  preferences: number;
  location: number;
  price: number;
  rating: number;
  availability: number;
  profile_completeness: number;
  experience: number;
  updated_at: string;
}

export interface UserPriorities {
  id: string;
  user_id: string;
  role: UserRole;
  location_priority: Priority;
  price_priority: Priority;
  rating_priority: Priority;
  availability_priority: Priority;
  experience_priority: Priority;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  action_type: SyncAction;
  table_name: string;
  record_id: string;
  payload: Record<string, unknown>;
  status: SyncStatus;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  synced_at: string | null;
}

export interface FitScoreBreakdown {
  preferences: number;
  location: number;
  price: number;
  rating: number;
  availability: number;
  profileCompleteness: number;
  experience: number;
}

export interface FitScoreResult {
  score: number;
  breakdown: FitScoreBreakdown;
}

// Extended types for UI
export interface ProviderCardData extends User {
  provider_profile: ProviderProfile;
  fit_score: number;
  fit_score_breakdown: FitScoreBreakdown;
}

export interface RequestCardData extends ServiceRequest {
  client: User;
  client_profile: ClientProfile;
  fit_score: number;
  fit_score_breakdown: FitScoreBreakdown;
}

export interface ConversationWithDetails extends Conversation {
  match: Match;
  other_user: User;
  other_user_profile: ProviderProfile | ClientProfile | null;
  last_message: Message | null;
  unread_count: number;
}

export interface MatchWithDetails extends Match {
  client: User;
  provider: User;
  client_profile: ClientProfile | null;
  provider_profile: ProviderProfile | null;
  request: ServiceRequest | null;
}
