# Binder - Professional Service Marketplace for Cameroon

A production-ready, offline-first Progressive Web Application (PWA) built with Next.js 14, Supabase, and Dexie.js.

## Overview

Binder connects clients who need professional services with skilled providers in Cameroon. Features include:
- **Swipe-based matching** (like a dating app for services)
- **FitScore algorithm** with 7 factors and dynamic weight adjustment
- **Offline-first** with full sync capabilities
- **PWA** installable on Android, iOS, and desktop
- **Bilingual** (English/French)
- **Asymmetric matching** flow

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Local DB**: Dexie.js (IndexedDB)
- **Remote DB**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: Zustand (with persist)
- **Forms**: React Hook Form + Zod
- **PWA**: next-pwa

## Setup

### 1. Prerequisites
- Node.js 18+ installed on your computer
- A Supabase project (free at supabase.com)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the project root with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from your Supabase dashboard: Project Settings > API > URL and anon public key.

### 4. Database Setup
The database schema and seed data are already applied to the configured Supabase instance.

If setting up a fresh Supabase project:
1. Go to your Supabase dashboard > SQL Editor
2. Copy and run the contents of `supabase/migrations/20260710173603_001_binder_initial_schema.sql` (creates all tables + RLS policies)
3. Then run `supabase/migrations/20260713105232_002_seed_binder_demo_data.sql` (inserts 10 dummy users, requests, matches, messages)
4. In Supabase dashboard > Authentication > Providers > Email: turn OFF "Confirm email" (so test accounts work without verification)

### 5. Run Locally
```bash
npm run dev
```
Then open http://localhost:3000 in your browser.

### 6. Build for Production
```bash
npm run build
npm run start
```

### 7. Seed Dummy Data (if needed)
If you're using a fresh database, navigate to `/seed` in your browser to populate dummy test accounts.

## Test Accounts

**Password for all accounts**: `password123`

### Clients
| Email | Name | Notes |
|-------|------|-------|
| marie@binder.cm | Marie Kamdem | Has match with Paul, has messages |
| grace@binder.cm | Grace Mbeng | Has sent interest to Joseph |
| baobab@binder.cm | Le Baobab Restaurant | |
| krystal@binder.cm | Hotel Krystal | |
| immo@binder.cm | Immo Douala | |

### Providers
| Email | Name | Notes |
|-------|------|-------|
| paul@binder.cm | Paul Ekwalla | Has match with Marie, has messages |
| sarah@binder.cm | Sarah Ndongo | |
| joseph@binder.cm | Joseph Fotso | Has notification from Grace |
| amina@binder.cm | Aminatou Bello | |
| emmanuel@binder.cm | Emmanuel Talla | |

## Features

### Authentication
- Email/password signup (requires internet)
- Offline sign-in using cached credentials
- Secure session management via Supabase Auth

### Onboarding Flow
1. **Objective** — Choose client or provider role
2. **Preferences** — Select service categories (max 4)
3. **Priorities** — Set importance of matching factors
4. **Profile Setup** — Complete profile with location, bio, etc.

### FitScore Algorithm
Calculates a 0-100 compatibility score using 7 weighted factors:
- Preferences (Jaccard similarity)
- Location
- Price
- Rating
- Availability
- Profile Completeness
- Experience

Weights adjust dynamically based on swipe feedback (feedback loop).

### Matching Flow
- **Provider swipes right on request** → Match created, client notified immediately
- **Client swipes right on provider** → Provider gets notification, can "Send My Info"
- **Mutual match** → Conversation created, both can chat

### Offline-First Architecture
- All data stored in IndexedDB (Dexie.js) first
- Supabase synced when online
- Sync queue with retry logic and exponential backoff
- Last-Write-Wins conflict resolution
- Offline indicator bar

## Deploy to Vercel

1. Push to GitHub
2. Import to vercel.com/new
3. Add environment variables
4. Deploy

## Notes

- Email verification is disabled in Supabase for demo purposes
- All dummy users have `is_dummy = true` — auto-reply only works for these
- Real users never receive fake auto-replies
