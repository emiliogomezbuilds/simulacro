-- Simulacro, Week 6 Business Bending schema
-- Paste this whole file into Supabase Dashboard > SQL Editor > New query > Run.

-- ============================================================
-- SCENARIO DEFINITIONS, the standardized scenario library the Blueprint bet
-- on. Seeded by this script only, no client insert/update/delete policy
-- exists, the app can only read. Each scenario is an original, fictional
-- construction (shadow clause, condition 1) tagged to a real Mexico City
-- soft-soil colonia (the geodata signal the packet describes).
-- ============================================================
create table if not exists scenario_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  colonia text not null,
  soil_type text not null default 'suelo blando',
  description text not null,
  is_simulated boolean not null default true,
  created_at timestamptz not null default now()
);

alter table scenario_definitions enable row level security;

create policy "scenario_definitions: readable by any signed-in user"
  on scenario_definitions for select
  using (auth.role() = 'authenticated');

insert into scenario_definitions (name, colonia, soil_type, description) values
  ('Pasillo con salida bloqueada (ejemplo simulado)',
   'Roma',
   'suelo blando, ex lago',
   'Edificio y pasillo ficticios. La salida principal esta bloqueada por un derrumbe parcial; hay una salida alterna clara al fondo.'),
  ('Escalera con obstruccion (ejemplo simulado)',
   'Condesa',
   'suelo blando, ex lago',
   'Edificio y escalera ficticios. Una de las dos escaleras esta obstruida; la otra esta despejada.'),
  ('Patio con salida secundaria (ejemplo simulado)',
   'Doctores',
   'suelo blando, ex lago',
   'Edificio y patio ficticios. La salida frente al patio esta bloqueada; una salida secundaria lateral esta despejada.')
on conflict do nothing;

-- ============================================================
-- PRETEST ANSWERS, condition 2's private trauma pre-check. One row per
-- user. Never shown to anyone but the user themselves, only used server-side
-- to silently pick the intensity mode.
-- ============================================================
create table if not exists pretest_answers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prior_trauma boolean not null,
  created_at timestamptz not null default now()
);

alter table pretest_answers enable row level security;

create policy "pretest_answers: user selects own"
  on pretest_answers for select
  using (auth.uid() = user_id);

create policy "pretest_answers: user inserts own"
  on pretest_answers for insert
  with check (auth.uid() = user_id);

create policy "pretest_answers: user updates own"
  on pretest_answers for update
  using (auth.uid() = user_id);

-- ============================================================
-- SCENARIO SESSIONS, one row per completed run. Condition 3: no biometric,
-- facial, or emotional capture, only the decision, the reaction time, and
-- the resulting debrief are stored.
-- ============================================================
create table if not exists scenario_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid not null references scenario_definitions(id),
  intensity text not null check (intensity in ('standard', 'low')),
  chosen_exit text not null check (chosen_exit in ('blocked', 'clear')),
  reaction_time_ms integer not null check (reaction_time_ms >= 0 and reaction_time_ms < 300000),
  debrief text not null,
  debrief_method text not null check (debrief_method in ('ai', 'rule-based')),
  created_at timestamptz not null default now()
);

alter table scenario_sessions enable row level security;

create policy "scenario_sessions: user selects own"
  on scenario_sessions for select
  using (auth.uid() = user_id);

create policy "scenario_sessions: user inserts own"
  on scenario_sessions for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- TABLE-LEVEL GRANTS. RLS restricts rows, but PostgREST also needs the base
-- grant to touch these tables at all, learned the hard way in a sibling
-- project this same week: "Automatically expose new tables" off at project
-- creation blocks every request with a 403, reads included, even with RLS
-- configured correctly. Grant explicitly so that mistake cannot repeat here.
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select on public.scenario_definitions to authenticated;
grant select, insert, update on public.pretest_answers to authenticated;
grant select, insert on public.scenario_sessions to authenticated;
