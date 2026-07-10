'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const DUMMY_PASSWORD = 'password123';

const CLIENTS = [
  { email: 'marie@binder.cm', name: 'Marie Kamdem', phone: '+237690000001', avatar_color: 'blue' },
  { email: 'grace@binder.cm', name: 'Grace Mbeng', phone: '+237690000002', avatar_color: 'green' },
  { email: 'baobab@binder.cm', name: 'Le Baobab Restaurant', phone: '+237690000003', avatar_color: 'purple' },
  { email: 'krystal@binder.cm', name: 'Hotel Krystal', phone: '+237690000004', avatar_color: 'orange' },
  { email: 'immo@binder.cm', name: 'Immo Douala', phone: '+237690000005', avatar_color: 'pink' },
];

const PROVIDERS = [
  { email: 'paul@binder.cm', name: 'Paul Ekwalla', phone: '+237655123456', avatar_color: 'blue' },
  { email: 'sarah@binder.cm', name: 'Sarah Ndongo', phone: '+237677234567', avatar_color: 'green' },
  { email: 'joseph@binder.cm', name: 'Joseph Fotso', phone: '+237699345678', avatar_color: 'purple' },
  { email: 'amina@binder.cm', name: 'Aminatou Bello', phone: '+237670456789', avatar_color: 'orange' },
  { email: 'emmanuel@binder.cm', name: 'Emmanuel Talla', phone: '+237656567890', avatar_color: 'pink' },
];

export default function SeedPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Checking...');
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const log = (msg: string) => setLogs((prev) => [...prev, msg]);

  useEffect(() => {
    runSeed();
  }, []);

  const createUser = async (email: string, name: string, phone: string, avatarColor: string, role: 'client' | 'provider') => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: DUMMY_PASSWORD,
    });

    if (authError && !authError.message.includes('already registered')) {
      log(`Warning: ${email}: ${authError.message}`);
    }

    let userId = authData?.user?.id;

    if (!userId) {
      const { data: signIn } = await supabase.auth.signInWithPassword({ email, password: DUMMY_PASSWORD });
      userId = signIn?.user?.id;
    }

    if (!userId) {
      log(`Failed to get ID for ${email}`);
      return null;
    }

    const now = new Date().toISOString();
    await supabase.from('users').upsert({
      id: userId, email, name, phone, language: 'en',
      has_client_profile: role === 'client',
      has_provider_profile: role === 'provider',
      active_role: role,
      avatar_color: avatarColor,
      is_dummy: true, is_deleted: false,
      created_at: now, updated_at: now,
    });

    await supabase.auth.signOut();
    return userId;
  };

  const runSeed = async () => {
    setStatus('Checking existing data...');

    const { data: existing } = await supabase.from('users').select('id').eq('is_dummy', true).limit(1);
    if (existing && existing.length > 0) {
      setStatus('Already seeded!');
      setDone(true);
      log('Dummy data already exists. Redirecting...');
      setTimeout(() => router.push('/landing'), 2000);
      return;
    }

    setStatus('Creating dummy users...');
    const clientIds: Record<string, string> = {};
    const providerIds: Record<string, string> = {};

    for (const c of CLIENTS) {
      const id = await createUser(c.email, c.name, c.phone, c.avatar_color, 'client');
      if (id) { clientIds[c.email] = id; log(`Client: ${c.name}`); }
    }

    for (const p of PROVIDERS) {
      const id = await createUser(p.email, p.name, p.phone, p.avatar_color, 'provider');
      if (id) { providerIds[p.email] = id; log(`Provider: ${p.name}`); }
    }

    const now = new Date().toISOString();

    // Client profiles
    const clientProfileData = [
      { email: 'marie@binder.cm', location: 'Douala', quartier: 'Bonapriso', budget_range: '10k_30k', budget_value: 20000, description: 'Looking for reliable plumbing services', preferences: ['Plumbing', 'Electrical'], profile_completion: 80 },
      { email: 'grace@binder.cm', location: 'Douala', quartier: 'Akwa', budget_range: '30k_100k', budget_value: 65000, description: 'Home renovation projects', preferences: ['Tiling', 'Carpentry'], profile_completion: 75 },
      { email: 'baobab@binder.cm', location: 'Douala', quartier: 'Bonanjo', budget_range: '30k_100k', budget_value: 65000, description: 'Restaurant services', preferences: ['Cleaning', 'Cooking'], profile_completion: 70 },
      { email: 'krystal@binder.cm', location: 'Douala', quartier: 'Deido', budget_range: '10k_30k', budget_value: 20000, description: 'Hotel maintenance', preferences: ['Plumbing', 'Electrical'], profile_completion: 65 },
      { email: 'immo@binder.cm', location: 'Douala', quartier: 'Bonaberi', budget_range: 'above_100k', budget_value: 150000, description: 'Apartment complex maintenance', preferences: ['Electrical', 'Plumbing'], profile_completion: 85 },
    ];

    for (const cp of clientProfileData) {
      const uid = clientIds[cp.email];
      if (!uid) continue;
      await supabase.from('client_profiles').upsert({
        id: crypto.randomUUID(), user_id: uid,
        location: cp.location, quartier: cp.quartier,
        budget_range: cp.budget_range, budget_value: cp.budget_value,
        description: cp.description, preferences: cp.preferences,
        profile_completion: cp.profile_completion,
        created_at: now, updated_at: now,
      });
    }

    // Provider profiles
    const providerProfileData = [
      { email: 'paul@binder.cm', location: 'Douala', quartier: 'Bonanjo', skills: ['Plumbing', 'Welding', 'Tiling'], price: 15000, availability: 'immediate', experience: 8, bio: 'Professional plumber with 8 years experience.', phone: '+237655123456', whatsapp: '+237655123456', rating: 4.8, review_count: 47, profile_completion: 95 },
      { email: 'sarah@binder.cm', location: 'Douala', quartier: 'Bali', skills: ['Cleaning', 'Cooking'], price: 8000, availability: 'flexible', experience: 6, bio: 'Professional cleaner and cook.', phone: '+237677234567', whatsapp: '', rating: 4.9, review_count: 89, profile_completion: 90 },
      { email: 'joseph@binder.cm', location: 'Douala', quartier: 'Deido', skills: ['Electrical', 'Plumbing'], price: 20000, availability: 'this_week', experience: 6, bio: 'Licensed electrician and plumber.', phone: '+237699345678', whatsapp: '+237699345678', rating: 4.6, review_count: 34, profile_completion: 88 },
      { email: 'amina@binder.cm', location: 'Yaoundé', quartier: 'Bastos', skills: ['Carpentry', 'Painting'], price: 25000, availability: 'flexible', experience: 10, bio: 'Expert carpenter and painter.', phone: '+237670456789', whatsapp: '', rating: 4.7, review_count: 52, profile_completion: 85 },
      { email: 'emmanuel@binder.cm', location: 'Douala', quartier: 'Akwa', skills: ['Painting', 'Tiling'], price: 12000, availability: 'immediate', experience: 4, bio: 'Skilled painter and tiler.', phone: '+237656567890', whatsapp: '', rating: 4.5, review_count: 28, profile_completion: 80 },
    ];

    for (const pp of providerProfileData) {
      const uid = providerIds[pp.email];
      if (!uid) continue;
      await supabase.from('provider_profiles').upsert({
        id: crypto.randomUUID(), user_id: uid, ...pp,
        created_at: now, updated_at: now,
      });
    }

    // Service requests
    const requestData = [
      { email: 'marie@binder.cm', title: 'Fix broken bathroom sink', description: 'Bathroom sink is leaking', category: 'plumbing', budget: 15000, urgency: 'urgent', required_skills: ['Plumbing'] },
      { email: 'grace@binder.cm', title: 'Install kitchen tiles', description: 'Need tiles installed', category: 'tiling', budget: 45000, urgency: 'flexible', required_skills: ['Tiling'] },
      { email: 'baobab@binder.cm', title: 'Weekly cleaning service', description: 'Weekly professional cleaning', category: 'cleaning', budget: 50000, urgency: 'flexible', required_skills: ['Cleaning'] },
      { email: 'krystal@binder.cm', title: 'Emergency plumber needed', description: 'Urgent plumbing issue', category: 'plumbing', budget: 30000, urgency: 'urgent', required_skills: ['Plumbing'] },
      { email: 'immo@binder.cm', title: 'Apartment electrical repairs', description: 'Multiple units need electrical work', category: 'electrical', budget: 80000, urgency: 'this_week', required_skills: ['Electrical', 'Plumbing'] },
    ];

    const insertedRequests: Record<string, string> = {};
    for (const req of requestData) {
      const uid = clientIds[req.email];
      if (!uid) continue;
      const reqId = crypto.randomUUID();
      const { email: _, ...reqFields } = req;
      await supabase.from('service_requests').upsert({
        id: reqId, client_id: uid, ...reqFields,
        location: 'Douala', status: 'open', accepted_provider_id: null,
        created_at: now, updated_at: now, completed_at: null,
      });
      insertedRequests[uid] = reqId;
    }

    // Weights
    const defaultWeights = { preferences: 0.2, location: 0.15, price: 0.15, rating: 0.15, availability: 0.15, profile_completeness: 0.1, experience: 0.1 };
    for (const [email, uid] of Object.entries(clientIds)) {
      await supabase.from('weights').upsert({ id: crypto.randomUUID(), user_id: uid, role: 'client', ...defaultWeights, updated_at: now });
    }
    for (const [email, uid] of Object.entries(providerIds)) {
      await supabase.from('weights').upsert({ id: crypto.randomUUID(), user_id: uid, role: 'provider', ...defaultWeights, updated_at: now });
    }

    // Pre-loaded match: Paul + Marie
    const marieId = clientIds['marie@binder.cm'];
    const paulId = providerIds['paul@binder.cm'];
    const marieReqId = insertedRequests[marieId];

    if (marieId && paulId && marieReqId) {
      const matchId = crypto.randomUUID();
      await supabase.from('matches').upsert({
        id: matchId, client_id: marieId, provider_id: paulId,
        request_id: marieReqId, initiated_by: 'provider',
        client_fit_score: 0, provider_fit_score: 82,
        status: 'mutual', contact_revealed: true,
        created_at: now, updated_at: now,
      });

      const convId = crypto.randomUUID();
      await supabase.from('conversations').upsert({
        id: convId, match_id: matchId, created_at: now, last_message_at: now,
      });

      const msgs = [
        { sender_id: paulId, content: 'Hello! I can fix your sink today.', sent_at: new Date(Date.now() - 3600000).toISOString() },
        { sender_id: marieId, content: 'Great! What is your rate?', sent_at: new Date(Date.now() - 3000000).toISOString() },
        { sender_id: paulId, content: '15,000 FCFA for the job.', sent_at: new Date(Date.now() - 2400000).toISOString() },
      ];
      for (const msg of msgs) {
        await supabase.from('messages').insert({
          id: crypto.randomUUID(), conversation_id: convId,
          ...msg, is_read: true, is_synced: true,
          is_deleted_for_sender: false, is_deleted_for_everyone: false, deleted_at: null,
        });
      }
      log('Marie-Paul match + conversation created');
    }

    // Grace-Joseph interaction
    const graceId = clientIds['grace@binder.cm'];
    const josephId = providerIds['joseph@binder.cm'];
    if (graceId && josephId) {
      const graceMatchId = crypto.randomUUID();
      await supabase.from('matches').upsert({
        id: graceMatchId, client_id: graceId, provider_id: josephId,
        request_id: insertedRequests[graceId] || null,
        initiated_by: 'client', client_fit_score: 65, provider_fit_score: 0,
        status: 'client_interested', contact_revealed: false,
        created_at: now, updated_at: now,
      });
      await supabase.from('notifications').upsert({
        id: crypto.randomUUID(), user_id: josephId,
        type: 'request_response', title: 'A client wants more info',
        body: 'Grace Mbeng is interested in your services',
        is_read: false, reference_id: graceId, created_at: now,
      });
      log('Grace-Joseph interaction created');
    }

    setStatus('Seed complete!');
    log('All done! Redirecting to landing...');
    setDone(true);
    setTimeout(() => router.push('/landing'), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          {!done && <div className="w-5 h-5 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />}
          <h1 className="text-lg font-bold text-slate-900">{status}</h1>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {logs.map((log, i) => (
            <p key={i} className="text-xs text-slate-500">• {log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
