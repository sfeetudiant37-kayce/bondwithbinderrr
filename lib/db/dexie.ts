import Dexie, { Table } from 'dexie';
import type {
  User, ClientProfile, ProviderProfile, ServiceRequest,
  Swipe, Match, Conversation, Message, Review,
  Notification, Weights, UserPriorities, SyncQueueItem
} from '@/types';

export class BinderDB extends Dexie {
  users!: Table<User>;
  client_profiles!: Table<ClientProfile>;
  provider_profiles!: Table<ProviderProfile>;
  service_requests!: Table<ServiceRequest>;
  swipes!: Table<Swipe>;
  matches!: Table<Match>;
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  reviews!: Table<Review>;
  notifications!: Table<Notification>;
  weights!: Table<Weights>;
  user_priorities!: Table<UserPriorities>;
  sync_queue!: Table<SyncQueueItem>;

  constructor() {
    super('BinderDB');
    this.version(1).stores({
      users: 'id, email, active_role, is_dummy, is_deleted, updated_at',
      client_profiles: 'id, user_id, location, updated_at',
      provider_profiles: 'id, user_id, location, availability, updated_at',
      service_requests: 'id, client_id, status, urgency, category, updated_at',
      swipes: 'id, swiper_id, target_id, target_type, direction, created_at',
      matches: 'id, client_id, provider_id, request_id, status, updated_at',
      conversations: 'id, match_id, last_message_at',
      messages: 'id, conversation_id, sender_id, is_read, sent_at',
      reviews: 'id, match_id, reviewer_id, reviewee_id, created_at',
      notifications: 'id, user_id, type, is_read, created_at',
      weights: 'id, user_id, role, updated_at',
      user_priorities: 'id, user_id, role, created_at',
      sync_queue: 'id, user_id, status, action_type, table_name, created_at',
    });
  }
}

let db: BinderDB;

export function getDB(): BinderDB {
  if (typeof window === 'undefined') {
    throw new Error('Dexie can only be used in browser context');
  }
  if (!db) {
    db = new BinderDB();
  }
  return db;
}
