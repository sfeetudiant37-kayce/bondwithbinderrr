import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DUMMY_PASSWORD = 'password123';

interface SeedUser {
  email: string;
  name: string;
  phone: string;
  avatar_color: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  role: 'client' | 'provider';
}

const CLIENTS: SeedUser[] = [
  { email: 'marie@binder.cm', name: 'Marie Kamdem', phone: '+237690000001', avatar_color: 'blue', role: 'client' },
  { email: 'grace@binder.cm', name: 'Grace Mbeng', phone: '+237690000002', avatar_color: 'green', role: 'client' },
  { email: 'baobab@binder.cm', name: 'Le Baobab Restaurant', phone: '+237690000003', avatar_color: 'purple', role: 'client' },
  { email: 'krystal@binder.cm', name: 'Hotel Krystal', phone: '+237690000004', avatar_color: 'orange', role: 'client' },
  { email: 'immo@binder.cm', name: 'Immo Douala', phone: '+237690000005', avatar_color: 'pink', role: 'client' },
];

const PROVIDERS: SeedUser[] = [
  { email: 'paul@binder.cm', name: 'Paul Ekwalla', phone: '+237655123456', avatar_color: 'blue', role: 'provider' },
  { email: 'sarah@binder.cm', name: 'Sarah Ndongo', phone: '+237677234567', avatar_color: 'green', role: 'provider' },
  { email: 'joseph@binder.cm', name: 'Joseph Fotso', phone: '+237699345678', avatar_color: 'purple', role: 'provider' },
  { email: 'amina@binder.cm', name: 'Aminatou Bello', phone: '+237670456789', avatar_color: 'orange', role: 'provider' },
  { email: 'emmanuel@binder.cm', name: 'Emmanuel Talla', phone: '+237656567890', avatar_color: 'pink', role: 'provider' },
];

async function createUser(seedUser: SeedUser) {
  // Sign up with Supabase auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: seedUser.email,
    password: DUMMY_PASSWORD,
  });

  if (authError && !authError.message.includes('already registered')) {
    console.error(`Failed to create auth for ${seedUser.email}:`, authError.message);
    return null;
  }

  // Get user ID (either newly created or existing)
  let userId: string;
  if (authData?.user) {
    userId = authData.user.id;
  } else {
    // Try to get existing user
    const { data: existingAuth } = await supabase.auth.signInWithPassword({
      email: seedUser.email,
      password: DUMMY_PASSWORD,
    });
    if (!existingAuth?.user) {
      console.error(`Could not get user ID for ${seedUser.email}`);
      return null;
    }
    userId = existingAuth.user.id;
  }

  const now = new Date().toISOString();
  const isClient = seedUser.role === 'client';

  const userData = {
    id: userId,
    email: seedUser.email,
    name: seedUser.name,
    phone: seedUser.phone,
    language: 'en',
    has_client_profile: isClient,
    has_provider_profile: !isClient,
    active_role: seedUser.role,
    avatar_color: seedUser.avatar_color,
    is_dummy: true,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  };

  const { error: userError } = await supabase.from('users').upsert(userData);
  if (userError) {
    console.error(`Failed to insert user ${seedUser.email}:`, userError.message);
  }

  return userId;
}

async function seed() {
  console.log('Seeding dummy users...');

  const clientIds: Record<string, string> = {};
  const providerIds: Record<string, string> = {};

  // Create clients
  for (const client of CLIENTS) {
    const id = await createUser(client);
    if (id) {
      clientIds[client.email] = id;
      console.log(`Created client: ${client.name} (${id})`);
    }
  }

  // Create providers
  for (const provider of PROVIDERS) {
    const id = await createUser(provider);
    if (id) {
      providerIds[provider.email] = id;
      console.log(`Created provider: ${provider.name} (${id})`);
    }
  }

  const now = new Date().toISOString();

  // Client profiles
  const clientProfiles = [
    {
      id: crypto.randomUUID(), user_id: clientIds['marie@binder.cm'],
      location: 'Douala', quartier: 'Bonapriso',
      budget_range: '10k_30k', budget_value: 20000,
      description: 'Looking for reliable plumbing services', preferences: ['Plumbing', 'Electrical'],
      profile_completion: 80, created_at: now, updated_at: now,
    },
    {
      id: crypto.randomUUID(), user_id: clientIds['grace@binder.cm'],
      location: 'Douala', quartier: 'Akwa',
      budget_range: '30k_100k', budget_value: 65000,
      description: 'Home renovation projects', preferences: ['Tiling', 'Carpentry'],
      profile_completion: 75, created_at: now, updated_at: now,
    },
    {
      id: crypto.randomUUID(), user_id: clientIds['baobab@binder.cm'],
      location: 'Douala', quartier: 'Bonanjo',
      budget_range: '30k_100k', budget_value: 65000,
      description: 'Restaurant cleaning and cooking services needed', preferences: ['Cleaning', 'Cooking'],
      profile_completion: 70, created_at: now, updated_at: now,
    },
    {
      id: crypto.randomUUID(), user_id: clientIds['krystal@binder.cm'],
      location: 'Douala', quartier: 'Deido',
      budget_range: '10k_30k', budget_value: 20000,
      description: 'Hotel maintenance services', preferences: ['Plumbing', 'Electrical'],
      profile_completion: 65, created_at: now, updated_at: now,
    },
    {
      id: crypto.randomUUID(), user_id: clientIds['immo@binder.cm'],
      location: 'Douala', quartier: 'Bonaberi',
      budget_range: 'above_100k', budget_value: 150000,
      description: 'Apartment complex electrical and plumbing maintenance', preferences: ['Electrical', 'Plumbing'],
      profile_completion: 85, created_at: now, updated_at: now,
    },
  ].filter((cp) => cp.user_id);

  for (const cp of clientProfiles) {
    const { error } = await supabase.from('client_profiles').upsert(cp);
    if (error) console.error('Error inserting client profile:', error.message);
  }

  // Provider profiles
  const providerProfiles = [
    {
      id: crypto.randomUUID(), user_id: providerIds['paul@binder.cm'],
      location: 'Douala', quartier: 'Bonanjo',
      skills: ['Plumbing', 'Welding', 'Tiling'],
      price: 15000, availability: 'immediate', experience: 8,
      bio: 'Professional plumber with 8 years experience. Available immediately.',
      phone: '+237655123456', whatsapp: '+237655123456',
      rating: 4.8, review_count: 47, profile_completion: 95,
      created_at: now, updated_at: now,
    },
    {
      id: crypto.randomUUID(), user_id: providerIds['sarah@binder.cm'],
      location: 'Douala', quartier: 'Bali',
      skills: ['Cleaning', 'Cooking'],
      price: 8000, availability: 'flexible', experience: 6,
      bio: 'Professional cleaner and cook. Excellent reviews.',
      phone: '+237677234567', whatsapp: '',
      rating: 4.9, review_count: 89, profile_completion: 90,
      created_at: now, updated_at: now,
    },
    {
      id: crypto.randomUUID(), user_id: providerIds['joseph@binder.cm'],
      location: 'Douala', quartier: 'Deido',
      skills: ['Electrical', 'Plumbing'],
      price: 20000, availability: 'this_week', experience: 6,
      bio: 'Licensed electrician and plumber serving Douala.',
      phone: '+237699345678', whatsapp: '+237699345678',
      rating: 4.6, review_count: 34, profile_completion: 88,
      created_at: now, updated_at: now,
    },
    {
      id: crypto.randomUUID(), user_id: providerIds['amina@binder.cm'],
      location: 'Yaoundé', quartier: 'Bastos',
      skills: ['Carpentry', 'Painting'],
      price: 25000, availability: 'flexible', experience: 10,
      bio: 'Expert carpenter and painter based in Yaoundé.',
      phone: '+237670456789', whatsapp: '',
      rating: 4.7, review_count: 52, profile_completion: 85,
      created_at: now, updated_at: now,
    },
    {
      id: crypto.randomUUID(), user_id: providerIds['emmanuel@binder.cm'],
      location: 'Douala', quartier: 'Akwa',
      skills: ['Painting', 'Tiling'],
      price: 12000, availability: 'immediate', experience: 4,
      bio: 'Skilled painter and tiler with competitive rates.',
      phone: '+237656567890', whatsapp: '',
      rating: 4.5, review_count: 28, profile_completion: 80,
      created_at: now, updated_at: now,
    },
  ].filter((pp) => pp.user_id);

  for (const pp of providerProfiles) {
    const { error } = await supabase.from('provider_profiles').upsert(pp);
    if (error) console.error('Error inserting provider profile:', error.message);
  }

  // Service requests
  const requests = [
    {
      id: crypto.randomUUID(), client_id: clientIds['marie@binder.cm'],
      title: 'Fix broken bathroom sink', description: 'Bathroom sink is leaking and needs repair',
      category: 'plumbing', location: 'Douala', budget: 15000, urgency: 'urgent',
      required_skills: ['Plumbing'], status: 'open', accepted_provider_id: null,
      created_at: now, updated_at: now, completed_at: null,
    },
    {
      id: crypto.randomUUID(), client_id: clientIds['grace@binder.cm'],
      title: 'Install kitchen tiles', description: 'Need tiles installed in new kitchen',
      category: 'tiling', location: 'Douala', budget: 45000, urgency: 'flexible',
      required_skills: ['Tiling'], status: 'open', accepted_provider_id: null,
      created_at: now, updated_at: now, completed_at: null,
    },
    {
      id: crypto.randomUUID(), client_id: clientIds['baobab@binder.cm'],
      title: 'Weekly cleaning service', description: 'Need professional cleaning weekly',
      category: 'cleaning', location: 'Douala', budget: 50000, urgency: 'flexible',
      required_skills: ['Cleaning'], status: 'open', accepted_provider_id: null,
      created_at: now, updated_at: now, completed_at: null,
    },
    {
      id: crypto.randomUUID(), client_id: clientIds['krystal@binder.cm'],
      title: 'Emergency plumber needed', description: 'Urgent plumbing issue at hotel',
      category: 'plumbing', location: 'Douala', budget: 30000, urgency: 'urgent',
      required_skills: ['Plumbing'], status: 'open', accepted_provider_id: null,
      created_at: now, updated_at: now, completed_at: null,
    },
    {
      id: crypto.randomUUID(), client_id: clientIds['immo@binder.cm'],
      title: 'Apartment electrical repairs', description: 'Multiple units need electrical work',
      category: 'electrical', location: 'Douala', budget: 80000, urgency: 'this_week',
      required_skills: ['Electrical', 'Plumbing'], status: 'open', accepted_provider_id: null,
      created_at: now, updated_at: now, completed_at: null,
    },
  ].filter((r) => r.client_id);

  const insertedRequestIds: Record<string, string> = {};
  for (const req of requests) {
    const { error } = await supabase.from('service_requests').upsert(req);
    if (error) console.error('Error inserting request:', error.message);
    else insertedRequestIds[req.client_id] = req.id;
  }

  // Weights for dummy users
  const defaultWeights = {
    preferences: 0.2, location: 0.15, price: 0.15,
    rating: 0.15, availability: 0.15, profile_completeness: 0.1, experience: 0.1,
  };

  const allUserIds = [...Object.values(clientIds), ...Object.values(providerIds)];
  for (let i = 0; i < allUserIds.length; i++) {
    const uid = allUserIds[i];
    const role = i < CLIENTS.length ? 'client' : 'provider';
    const { error } = await supabase.from('weights').upsert({
      id: crypto.randomUUID(),
      user_id: uid,
      role,
      ...defaultWeights,
      updated_at: now,
    });
    if (error) console.error('Error inserting weights:', error.message);
  }

  // Pre-loaded match: Paul swiped right on Marie's plumbing request
  const marieId = clientIds['marie@binder.cm'];
  const paulId = providerIds['paul@binder.cm'];
  const marieRequestId = insertedRequestIds[marieId];

  if (marieId && paulId && marieRequestId) {
    const matchId = crypto.randomUUID();
    const { error: matchError } = await supabase.from('matches').upsert({
      id: matchId,
      client_id: marieId,
      provider_id: paulId,
      request_id: marieRequestId,
      initiated_by: 'provider',
      client_fit_score: 0,
      provider_fit_score: 82,
      status: 'mutual',
      contact_revealed: true,
      created_at: now,
      updated_at: now,
    });
    if (matchError) {
      console.error('Error creating pre-loaded match:', matchError.message);
    } else {
      // Create conversation
      const convId = crypto.randomUUID();
      await supabase.from('conversations').upsert({
        id: convId,
        match_id: matchId,
        created_at: now,
        last_message_at: now,
      });

      // Pre-loaded messages
      const msgs = [
        { id: crypto.randomUUID(), conversation_id: convId, sender_id: paulId, content: 'Hello! I can fix your sink today.', is_read: true, is_synced: true, is_deleted_for_sender: false, is_deleted_for_everyone: false, deleted_at: null, sent_at: new Date(Date.now() - 3600000).toISOString() },
        { id: crypto.randomUUID(), conversation_id: convId, sender_id: marieId, content: 'Great! What is your rate?', is_read: true, is_synced: true, is_deleted_for_sender: false, is_deleted_for_everyone: false, deleted_at: null, sent_at: new Date(Date.now() - 3000000).toISOString() },
        { id: crypto.randomUUID(), conversation_id: convId, sender_id: paulId, content: '15,000 FCFA for the job.', is_read: false, is_synced: true, is_deleted_for_sender: false, is_deleted_for_everyone: false, deleted_at: null, sent_at: new Date(Date.now() - 2400000).toISOString() },
      ];

      for (const msg of msgs) {
        await supabase.from('messages').upsert(msg);
      }

      console.log('Pre-loaded Marie-Paul match and conversation created');
    }

    // Paul's swipe on Marie's request
    await supabase.from('swipes').upsert({
      id: crypto.randomUUID(),
      swiper_id: paulId,
      target_id: marieRequestId,
      target_type: 'request',
      swiper_role: 'provider',
      direction: 'right',
      fit_score: 82,
      is_synced: true,
      is_undone: false,
      created_at: now,
    });
  }

  // Grace's swipe on Joseph (notification for Joseph)
  const graceId = clientIds['grace@binder.cm'];
  const josephId = providerIds['joseph@binder.cm'];
  if (graceId && josephId) {
    // Create swipe
    await supabase.from('swipes').upsert({
      id: crypto.randomUUID(),
      swiper_id: graceId,
      target_id: josephId,
      target_type: 'user',
      swiper_role: 'client',
      direction: 'right',
      fit_score: 65,
      is_synced: true,
      is_undone: false,
      created_at: now,
    });

    // Create match with client_interested status
    const graceMatchId = crypto.randomUUID();
    await supabase.from('matches').upsert({
      id: graceMatchId,
      client_id: graceId,
      provider_id: josephId,
      request_id: insertedRequestIds[graceId] || null,
      initiated_by: 'client',
      client_fit_score: 65,
      provider_fit_score: 0,
      status: 'client_interested',
      contact_revealed: false,
      created_at: now,
      updated_at: now,
    });

    // Notification for Joseph
    await supabase.from('notifications').upsert({
      id: crypto.randomUUID(),
      user_id: josephId,
      type: 'request_response',
      title: 'A client wants more info',
      body: `${CLIENTS[1].name} is interested in your services`,
      is_read: false,
      reference_id: graceId,
      created_at: now,
    });

    console.log('Grace-Joseph interaction created');
  }

  console.log('\nSeed complete!');
  console.log('Test accounts (password: password123):');
  console.log('Clients:', Object.entries(clientIds).map(([e, id]) => `${e}: ${id}`).join('\n'));
  console.log('Providers:', Object.entries(providerIds).map(([e, id]) => `${e}: ${id}`).join('\n'));
}

seed().catch(console.error);
