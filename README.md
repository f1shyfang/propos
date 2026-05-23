# hack48-ndis

Next.js 15 (App Router, TypeScript, Tailwind v4) + Supabase auth starter.

## Setup

1. Create a project at [supabase.com](https://supabase.com) and grab the API URL + anon key from **Project Settings → API**.
2. Fill in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

Open <http://localhost:3000>.

## Layout

- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `src/lib/supabase/server.ts` — server client for Server Components / Actions
- `src/lib/supabase/middleware.ts` — refreshes the session cookie on every request
- `src/middleware.ts` — wires the middleware up and gates `/protected/*`
- `src/app/login`, `src/app/signup` — email/password auth pages + server actions
- `src/app/protected` — example signed-in-only page

## Auth flow

- `/signup` → `supabase.auth.signUp` → email confirmation (if enabled in Supabase dashboard) → `/login`
- `/login` → `supabase.auth.signInWithPassword` → `/protected`
- `/protected` → redirects to `/login` if not signed in
- Sign out → `supabase.auth.signOut` → `/login`

To allow login without email confirmation during dev, disable **Confirm email** under Supabase **Authentication → Providers → Email**.
