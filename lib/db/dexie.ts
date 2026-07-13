import type {
  User, ClientProfile, ProviderProfile, ServiceRequest,
  Swipe, Match, Conversation, Message, Review,
  Notification, Weights, UserPriorities, SyncQueueItem
} from '@/types';

// Lazy-load Dexie only in browser to avoid SSR BroadcastChannel crash
type DexieTable<T> = {
  put(value: T): Promise<string>;
  get(key: string): Promise<T | undefined>;
  where(field: string): DexieWhereClause<T>;
  add(value: T): Promise<string>;
  update(key: string, changes: Partial<T>): Promise<number>;
  delete(key: string): Promise<void>;
  bulkPut(values: T[]): Promise<unknown>;
  toArray(): Promise<T[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
};

interface DexieWhereClause<T> {
  equals(value: string): DexieCollection<T>;
}

interface DexieCollection<T> {
  and(predicate: (item: T) => boolean): DexieCollection<T>;
  or(field: string): DexieWhereClause<T>;
  first(): Promise<T | undefined>;
  count(): Promise<number>;
  sortBy(field: string): Promise<T[]>;
  reverse(): DexieCollection<T>;
  toArray(): Promise<T[]>;
  delete(): Promise<number>;
  modify(changes: Partial<T>): Promise<number>;
  filter(predicate: (item: T) => boolean): DexieCollection<T>;
  limit(n: number): DexieCollection<T>;
}

interface BinderDBInterface {
  users: DexieTable<User>;
  client_profiles: DexieTable<ClientProfile>;
  provider_profiles: DexieTable<ProviderProfile>;
  service_requests: DexieTable<ServiceRequest>;
  swipes: DexieTable<Swipe>;
  matches: DexieTable<Match>;
  conversations: DexieTable<Conversation>;
  messages: DexieTable<Message>;
  reviews: DexieTable<Review>;
  notifications: DexieTable<Notification>;
  weights: DexieTable<Weights>;
  user_priorities: DexieTable<UserPriorities>;
  sync_queue: DexieTable<SyncQueueItem>;
}

let dbInstance: BinderDBInterface | null = null;

export function getDB(): BinderDBInterface {
  if (typeof window === 'undefined') {
    throw new Error('Dexie can only be used in browser context');
  }
  if (!dbInstance) {
    // Dynamically import Dexie to avoid SSR crash (BroadcastChannel undefined on server)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DexieModule = require('dexie');
    const Dexie = DexieModule.default || DexieModule;

    class BinderDB extends Dexie {
      users!: DexieTable<User>;
      client_profiles!: DexieTable<ClientProfile>;
      provider_profiles!: DexieTable<ProviderProfile>;
      service_requests!: DexieTable<ServiceRequest>;
      swipes!: DexieTable<Swipe>;
      matches!: DexieTable<Match>;
      conversations!: DexieTable<Conversation>;
      messages!: DexieTable<Message>;
      reviews!: DexieTable<Review>;
      notifications!: DexieTable<Notification>;
      weights!: DexieTable<Weights>;
      user_priorities!: DexieTable<UserPriorities>;
      sync_queue!: DexieTable<SyncQueueItem>;

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

    dbInstance = new BinderDB() as unknown as BinderDBInterface;
  }
  return dbInstance;
}
