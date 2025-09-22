-- Admin session events for superadmin reporting
create table if not exists public.admin_session_events (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	event_type text not null check (event_type in ('login','logout','soft_logout','unlock')),
	reason text,
	created_at timestamptz not null default now()
);

alter table public.admin_session_events enable row level security;

-- Admins can insert their own events
drop policy if exists "admins insert own session events" on public.admin_session_events;
create policy "admins insert own session events"
	on public.admin_session_events for insert
	with check (auth.uid() = user_id);

-- Superadmin can read all; users can read own
drop policy if exists "users view own session events" on public.admin_session_events;
create policy "users view own session events"
	on public.admin_session_events for select
	using (auth.uid() = user_id);

-- Optional: grant select to a superadmin role via DB role if used
-- Otherwise, build a PostgREST RPC or Supabase function for superadmin dashboard that bypasses RLS
