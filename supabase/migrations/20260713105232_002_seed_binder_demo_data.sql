/*
# Seed Binder demo data

## Overview
Creates 5 dummy client users and 5 dummy provider users with full profiles,
service requests, a pre-loaded match (Marie-Paul), conversation + messages,
and a notification (Grace → Joseph).

## What's inserted
- 10 auth.users (password: password123) with is_dummy=true
- 10 auth.identities records (required for sign-in)
- 5 client_profiles
- 5 provider_profiles (with ratings, reviews, contact info)
- 5 service_requests
- 10 weights + 10 user_priorities records
- 1 mutual match (Marie-Paul) + conversation + 3 messages
- 1 client_interested match (Grace-Joseph)
- 1 notification for Joseph
- 2 swipe records

## Notes
- All seed users have is_dummy=true (enables auto-reply)
- Password: password123 (bcrypt via crypt())
- Email confirmation disabled
- Idempotent: skips existing records
*/

DO $$
DECLARE
  v_marie_id uuid;
  v_grace_id uuid;
  v_baobab_id uuid;
  v_krystal_id uuid;
  v_immo_id uuid;
  v_paul_id uuid;
  v_sarah_id uuid;
  v_joseph_id uuid;
  v_amina_id uuid;
  v_emmanuel_id uuid;
  v_now timestamptz := now();
  v_request_id uuid;
  v_match_id uuid;
  v_conv_id uuid;
  v_count integer;
BEGIN
  -- Insert auth users only if they don't exist yet
  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'marie@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'marie@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Marie Kamdem"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'grace@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'grace@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Mbeng"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'baobab@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'baobab@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Le Baobab Restaurant"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'krystal@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'krystal@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Hotel Krystal"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'immo@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'immo@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Immo Douala"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'paul@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'paul@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Paul Ekwalla"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'sarah@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sarah@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Ndongo"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'joseph@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'joseph@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Joseph Fotso"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'amina@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'amina@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Aminatou Bello"}', false);
  END IF;

  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'emmanuel@binder.cm';
  IF v_count = 0 THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'emmanuel@binder.cm', crypt('password123', gen_salt('bf')), v_now, v_now, v_now, '{"provider":"email","providers":["email"]}', '{"full_name":"Emmanuel Talla"}', false);
  END IF;

  -- Capture user IDs
  SELECT id INTO v_marie_id FROM auth.users WHERE email = 'marie@binder.cm';
  SELECT id INTO v_grace_id FROM auth.users WHERE email = 'grace@binder.cm';
  SELECT id INTO v_baobab_id FROM auth.users WHERE email = 'baobab@binder.cm';
  SELECT id INTO v_krystal_id FROM auth.users WHERE email = 'krystal@binder.cm';
  SELECT id INTO v_immo_id FROM auth.users WHERE email = 'immo@binder.cm';
  SELECT id INTO v_paul_id FROM auth.users WHERE email = 'paul@binder.cm';
  SELECT id INTO v_sarah_id FROM auth.users WHERE email = 'sarah@binder.cm';
  SELECT id INTO v_joseph_id FROM auth.users WHERE email = 'joseph@binder.cm';
  SELECT id INTO v_amina_id FROM auth.users WHERE email = 'amina@binder.cm';
  SELECT id INTO v_emmanuel_id FROM auth.users WHERE email = 'emmanuel@binder.cm';

  -- Ensure auth.identities exist (email column is generated, omit it)
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', v_now, v_now, v_now
  FROM auth.users u
  WHERE u.email LIKE '%@binder.cm'
    AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email');

  -- Insert public.users
  INSERT INTO users (id, email, name, phone, language, has_client_profile, has_provider_profile, active_role, avatar_color, is_dummy, is_deleted, created_at, updated_at)
  VALUES
    (v_marie_id, 'marie@binder.cm', 'Marie Kamdem', '+237690000001', 'en', true, false, 'client', 'blue', true, false, v_now, v_now),
    (v_grace_id, 'grace@binder.cm', 'Grace Mbeng', '+237690000002', 'en', true, false, 'client', 'green', true, false, v_now, v_now),
    (v_baobab_id, 'baobab@binder.cm', 'Le Baobab Restaurant', '+237690000003', 'en', true, false, 'client', 'purple', true, false, v_now, v_now),
    (v_krystal_id, 'krystal@binder.cm', 'Hotel Krystal', '+237690000004', 'en', true, false, 'client', 'orange', true, false, v_now, v_now),
    (v_immo_id, 'immo@binder.cm', 'Immo Douala', '+237690000005', 'en', true, false, 'client', 'pink', true, false, v_now, v_now),
    (v_paul_id, 'paul@binder.cm', 'Paul Ekwalla', '+237655123456', 'en', false, true, 'provider', 'blue', true, false, v_now, v_now),
    (v_sarah_id, 'sarah@binder.cm', 'Sarah Ndongo', '+237677234567', 'en', false, true, 'provider', 'green', true, false, v_now, v_now),
    (v_joseph_id, 'joseph@binder.cm', 'Joseph Fotso', '+237699345678', 'en', false, true, 'provider', 'purple', true, false, v_now, v_now),
    (v_amina_id, 'amina@binder.cm', 'Aminatou Bello', '+237670456789', 'en', false, true, 'provider', 'orange', true, false, v_now, v_now),
    (v_emmanuel_id, 'emmanuel@binder.cm', 'Emmanuel Talla', '+237656567890', 'en', false, true, 'provider', 'pink', true, false, v_now, v_now)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, phone = EXCLUDED.phone, is_dummy = true, is_deleted = false,
    has_client_profile = EXCLUDED.has_client_profile, has_provider_profile = EXCLUDED.has_provider_profile,
    active_role = EXCLUDED.active_role, avatar_color = EXCLUDED.avatar_color, updated_at = v_now;

  -- Client profiles
  INSERT INTO client_profiles (id, user_id, location, quartier, budget_range, budget_value, description, preferences, profile_completion, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_marie_id, 'Douala', 'Bonapriso', '10k_30k', 20000, 'Looking for reliable plumbing services', ARRAY['Plumbing', 'Electrical'], 80, v_now, v_now),
    (gen_random_uuid(), v_grace_id, 'Douala', 'Akwa', '30k_100k', 65000, 'Home renovation projects', ARRAY['Tiling', 'Carpentry'], 75, v_now, v_now),
    (gen_random_uuid(), v_baobab_id, 'Douala', 'Bonanjo', '30k_100k', 65000, 'Restaurant cleaning and cooking services needed', ARRAY['Cleaning', 'Cooking'], 70, v_now, v_now),
    (gen_random_uuid(), v_krystal_id, 'Douala', 'Deido', '10k_30k', 20000, 'Hotel maintenance services', ARRAY['Plumbing', 'Electrical'], 65, v_now, v_now),
    (gen_random_uuid(), v_immo_id, 'Douala', 'Bonaberi', 'above_100k', 150000, 'Apartment complex electrical and plumbing maintenance', ARRAY['Electrical', 'Plumbing'], 85, v_now, v_now)
  ON CONFLICT (user_id) DO UPDATE SET
    location = EXCLUDED.location, quartier = EXCLUDED.quartier, budget_range = EXCLUDED.budget_range,
    budget_value = EXCLUDED.budget_value, description = EXCLUDED.description,
    preferences = EXCLUDED.preferences, profile_completion = EXCLUDED.profile_completion, updated_at = v_now;

  -- Provider profiles
  INSERT INTO provider_profiles (id, user_id, location, quartier, skills, price, availability, experience, bio, phone, whatsapp, rating, review_count, profile_completion, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_paul_id, 'Douala', 'Bonanjo', ARRAY['Plumbing', 'Welding', 'Tiling'], 15000, 'immediate', 8, 'Professional plumber with 8 years experience. Available immediately.', '+237655123456', '+237655123456', 4.80, 47, 95, v_now, v_now),
    (gen_random_uuid(), v_sarah_id, 'Douala', 'Bali', ARRAY['Cleaning', 'Cooking'], 8000, 'flexible', 6, 'Professional cleaner and cook. Excellent reviews.', '+237677234567', '', 4.90, 89, 90, v_now, v_now),
    (gen_random_uuid(), v_joseph_id, 'Douala', 'Deido', ARRAY['Electrical', 'Plumbing'], 20000, 'this_week', 6, 'Licensed electrician and plumber serving Douala.', '+237699345678', '+237699345678', 4.60, 34, 88, v_now, v_now),
    (gen_random_uuid(), v_amina_id, 'Yaoundé', 'Bastos', ARRAY['Carpentry', 'Painting'], 25000, 'flexible', 10, 'Expert carpenter and painter based in Yaoundé.', '+237670456789', '', 4.70, 52, 85, v_now, v_now),
    (gen_random_uuid(), v_emmanuel_id, 'Douala', 'Akwa', ARRAY['Painting', 'Tiling'], 12000, 'immediate', 4, 'Skilled painter and tiler with competitive rates.', '+237656567890', '', 4.50, 28, 80, v_now, v_now)
  ON CONFLICT (user_id) DO UPDATE SET
    location = EXCLUDED.location, quartier = EXCLUDED.quartier, skills = EXCLUDED.skills,
    price = EXCLUDED.price, availability = EXCLUDED.availability, experience = EXCLUDED.experience,
    bio = EXCLUDED.bio, phone = EXCLUDED.phone, whatsapp = EXCLUDED.whatsapp,
    rating = EXCLUDED.rating, review_count = EXCLUDED.review_count,
    profile_completion = EXCLUDED.profile_completion, updated_at = v_now;

  -- Service requests
  INSERT INTO service_requests (id, client_id, title, description, category, location, budget, urgency, required_skills, status, accepted_provider_id, created_at, updated_at, completed_at)
  VALUES
    (gen_random_uuid(), v_marie_id, 'Fix broken bathroom sink', 'Bathroom sink is leaking and needs repair', 'plumbing', 'Douala', 15000, 'urgent', ARRAY['Plumbing'], 'open', NULL, v_now, v_now, NULL),
    (gen_random_uuid(), v_grace_id, 'Install kitchen tiles', 'Need tiles installed in new kitchen', 'tiling', 'Douala', 45000, 'flexible', ARRAY['Tiling'], 'open', NULL, v_now, v_now, NULL),
    (gen_random_uuid(), v_baobab_id, 'Weekly cleaning service', 'Need professional cleaning weekly', 'cleaning', 'Douala', 50000, 'flexible', ARRAY['Cleaning'], 'open', NULL, v_now, v_now, NULL),
    (gen_random_uuid(), v_krystal_id, 'Emergency plumber needed', 'Urgent plumbing issue at hotel', 'plumbing', 'Douala', 30000, 'urgent', ARRAY['Plumbing'], 'open', NULL, v_now, v_now, NULL),
    (gen_random_uuid(), v_immo_id, 'Apartment electrical repairs', 'Multiple units need electrical work', 'electrical', 'Douala', 80000, 'this_week', ARRAY['Electrical', 'Plumbing'], 'open', NULL, v_now, v_now, NULL)
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO v_request_id FROM service_requests WHERE client_id = v_marie_id LIMIT 1;

  -- Weights
  INSERT INTO weights (id, user_id, role, preferences, location, price, rating, availability, profile_completeness, experience, updated_at)
  VALUES
    (gen_random_uuid(), v_marie_id, 'client', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_grace_id, 'client', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_baobab_id, 'client', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_krystal_id, 'client', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_immo_id, 'client', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_paul_id, 'provider', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_sarah_id, 'provider', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_joseph_id, 'provider', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_amina_id, 'provider', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now),
    (gen_random_uuid(), v_emmanuel_id, 'provider', 0.20, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10, v_now)
  ON CONFLICT (user_id, role) DO UPDATE SET
    preferences = EXCLUDED.preferences, location = EXCLUDED.location, price = EXCLUDED.price,
    rating = EXCLUDED.rating, availability = EXCLUDED.availability,
    profile_completeness = EXCLUDED.profile_completeness, experience = EXCLUDED.experience, updated_at = v_now;

  -- User priorities
  INSERT INTO user_priorities (id, user_id, role, location_priority, price_priority, rating_priority, availability_priority, experience_priority, created_at)
  VALUES
    (gen_random_uuid(), v_marie_id, 'client', 'high', 'high', 'medium', 'high', 'medium', v_now),
    (gen_random_uuid(), v_grace_id, 'client', 'medium', 'medium', 'medium', 'medium', 'medium', v_now),
    (gen_random_uuid(), v_baobab_id, 'client', 'medium', 'medium', 'medium', 'medium', 'medium', v_now),
    (gen_random_uuid(), v_krystal_id, 'client', 'high', 'high', 'medium', 'high', 'medium', v_now),
    (gen_random_uuid(), v_immo_id, 'client', 'medium', 'high', 'medium', 'medium', 'medium', v_now),
    (gen_random_uuid(), v_paul_id, 'provider', 'high', 'medium', 'high', 'high', 'medium', v_now),
    (gen_random_uuid(), v_sarah_id, 'provider', 'medium', 'medium', 'high', 'medium', 'medium', v_now),
    (gen_random_uuid(), v_joseph_id, 'provider', 'medium', 'medium', 'high', 'medium', 'medium', v_now),
    (gen_random_uuid(), v_amina_id, 'provider', 'high', 'medium', 'medium', 'medium', 'high', v_now),
    (gen_random_uuid(), v_emmanuel_id, 'provider', 'medium', 'medium', 'high', 'high', 'low', v_now)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Pre-loaded match: Paul + Marie (mutual)
  v_match_id := gen_random_uuid();
  INSERT INTO matches (id, client_id, provider_id, request_id, initiated_by, client_fit_score, provider_fit_score, status, contact_revealed, created_at, updated_at)
  VALUES (v_match_id, v_marie_id, v_paul_id, v_request_id, 'provider', 0, 82, 'mutual', true, v_now, v_now)
  ON CONFLICT (id) DO NOTHING;

  -- Conversation for Marie-Paul match
  v_conv_id := gen_random_uuid();
  INSERT INTO conversations (id, match_id, created_at, last_message_at)
  VALUES (v_conv_id, v_match_id, v_now, v_now)
  ON CONFLICT (id) DO NOTHING;

  -- Messages in Marie-Paul conversation
  INSERT INTO messages (id, conversation_id, sender_id, content, is_read, is_synced, is_deleted_for_sender, is_deleted_for_everyone, deleted_at, sent_at)
  VALUES
    (gen_random_uuid(), v_conv_id, v_paul_id, 'Hello! I can fix your sink today.', true, true, false, false, NULL, v_now - interval '1 hour'),
    (gen_random_uuid(), v_conv_id, v_marie_id, 'Great! What is your rate?', true, true, false, false, NULL, v_now - interval '50 minutes'),
    (gen_random_uuid(), v_conv_id, v_paul_id, '15,000 FCFA for the job.', false, true, false, false, NULL, v_now - interval '40 minutes')
  ON CONFLICT (id) DO NOTHING;

  -- Notification for Marie
  INSERT INTO notifications (id, user_id, type, title, body, is_read, reference_id, created_at)
  VALUES (gen_random_uuid(), v_marie_id, 'new_match', 'New provider interested', 'Paul Ekwalla is interested in your request: Fix broken bathroom sink', false, v_match_id, v_now)
  ON CONFLICT (id) DO NOTHING;

  -- Grace-Joseph interaction
  INSERT INTO matches (id, client_id, provider_id, request_id, initiated_by, client_fit_score, provider_fit_score, status, contact_revealed, created_at, updated_at)
  VALUES (gen_random_uuid(), v_grace_id, v_joseph_id, NULL, 'client', 65, 0, 'client_interested', false, v_now, v_now)
  ON CONFLICT (id) DO NOTHING;

  -- Notification for Joseph
  INSERT INTO notifications (id, user_id, type, title, body, is_read, reference_id, created_at)
  VALUES (gen_random_uuid(), v_joseph_id, 'request_response', 'A client wants more info', 'Grace Mbeng is interested in your services', false, v_grace_id, v_now)
  ON CONFLICT (id) DO NOTHING;

  -- Swipe records
  INSERT INTO swipes (id, swiper_id, target_id, target_type, swiper_role, direction, fit_score, is_synced, is_undone, created_at)
  VALUES
    (gen_random_uuid(), v_grace_id, v_joseph_id, 'user', 'client', 'right', 65, true, false, v_now),
    (gen_random_uuid(), v_paul_id, v_request_id, 'request', 'provider', 'right', 82, true, false, v_now)
  ON CONFLICT (id) DO NOTHING;

END $$;
