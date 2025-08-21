-- Bookings table and constraints
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  court text not null check (court in ('Court A','Court B')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  name text not null,
  phone text not null,
  status text not null default 'confirmed',
  inserted_at timestamptz not null default now()
);

-- Prevent overlapping bookings per court using an exclusion constraint
-- Requires btree_gist extension
create extension if not exists btree_gist;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    alter table public.bookings add constraint bookings_no_overlap exclude using gist (
      court with =,
      tstzrange(start_at, end_at, '[)') with &&
    );
  end if;
end $$;

-- Helpful index for day-based lookups (by date and court)
create index if not exists idx_bookings_court_start_end on public.bookings (court, start_at, end_at);


