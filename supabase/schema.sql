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
  -- 'corridor' scenarios are the original 3D / plain-text pattern-recognition
  -- test, with a visually or textually distinct blocked vs clear exit.
  -- 'dilemma' scenarios are a judgment test added after persona testing:
  -- two custom-labeled options, neither color-coded, correctness has to
  -- come from reading the scenario's own stated facts, not from spotting a
  -- shape. Both share scenario_sessions and the same clear/blocked
  -- correctness semantics.
  scenario_type text not null default 'corridor' check (scenario_type in ('corridor', 'dilemma')),
  option_a_label text,
  option_b_label text,
  correct_option text check (correct_option in ('a', 'b')),
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
   'En este edificio, el pasillo principal esta bloqueado por un derrumbe parcial; hay una salida alterna clara al fondo.'),
  ('Escalera con obstruccion (ejemplo simulado)',
   'Condesa',
   'suelo blando, ex lago',
   'En este edificio hay dos escaleras. Una esta obstruida; la otra esta despejada.'),
  ('Patio con salida secundaria (ejemplo simulado)',
   'Doctores',
   'suelo blando, ex lago',
   'En este edificio, la salida frente al patio esta bloqueada; una salida secundaria lateral esta despejada.')
on conflict do nothing;

insert into scenario_definitions (name, colonia, soil_type, description, scenario_type, option_a_label, option_b_label, correct_option) values
  ('Salon de cuarto piso con entrada bloqueada por una multitud (ejemplo simulado)',
   'Iztapalapa',
   'suelo blando, ex lago',
   'Estas en un salon del cuarto piso. La salida principal esta bloqueada por una multitud que no avanza. Hay una ventana angosta que da a un techo inclinado y resbaloso de un edificio vecino, tres pisos hacia abajo. Tambien hay una puerta trasera que lleva a una escalera de emergencia techada y sin obstrucciones, que baja hasta la calle.',
   'dilemma',
   'Salir por la ventana hacia el techo vecino',
   'Salir por la puerta trasera hacia la escalera de emergencia',
   'b')
on conflict do nothing;

-- ============================================================
-- SIX MORE SCENARIOS, added to build a full set of 10, so a person attempts
-- every scenario once instead of repeating a small pool forever. Five are
-- dilemma type: each one's correct answer follows only from facts stated
-- inside that scenario's own description (a reported gas leak, a visibly
-- cracked stairwell, a described crowd crush), never from a general safety
-- claim asserted as universal real-world fact.
-- ============================================================
insert into scenario_definitions (name, colonia, soil_type, description) values
  ('Comedor escolar con salida principal atascada (ejemplo simulado)',
   'Benito Juarez',
   'suelo blando, ex lago',
   'En este comedor escolar, la salida principal esta atascada por mesas volcadas; hay una salida lateral clara hacia el patio.')
on conflict do nothing;

insert into scenario_definitions (name, colonia, soil_type, description, scenario_type, option_a_label, option_b_label, correct_option) values
  ('Biblioteca en planta baja con estantes caidos (ejemplo simulado)',
   'Xochimilco',
   'suelo blando, ex lago',
   'Estas en una biblioteca en planta baja. El pasillo hacia la puerta de entrada esta bloqueado por estantes caidos que se ven inestables y podrian volver a caer. Hay una sala de lectura lateral cuya puerta ya esta despejada y da directo al patio.',
   'dilemma',
   'Trepar sobre los estantes caidos hacia la puerta de entrada',
   'Salir por la sala de lectura lateral hacia el patio',
   'b'),
  ('Taller de ciencias con fuga de gas reportada (ejemplo simulado)',
   'Tlahuac',
   'suelo blando, ex lago',
   'Estas en un taller de ciencias. Se reporto una fuga de gas cerca de la puerta que da al pasillo principal. La puerta del fondo del taller, lejos del olor a gas, tambien lleva a la salida del edificio.',
   'dilemma',
   'Salir por la puerta cercana a la fuga de gas reportada',
   'Salir por la puerta del fondo, lejos del olor a gas',
   'b'),
  ('Cancha techada con salida principal congestionada (ejemplo simulado)',
   'Venustiano Carranza',
   'suelo blando, ex lago',
   'Estas en una cancha techada. Una multitud se esta empujando frente a la salida principal, formando un cuello de botella peligroso. Hay una reja lateral de mantenimiento, menos conocida, que en este momento esta despejada.',
   'dilemma',
   'Unirse a la multitud en la salida principal',
   'Usar la reja lateral de mantenimiento, despejada',
   'b'),
  ('Dormitorio de internado con escalera agrietada (ejemplo simulado)',
   'Gustavo A. Madero',
   'suelo blando, ex lago',
   'Estas en un dormitorio en el segundo piso de un internado. La escalera interior tiene grietas visibles en la pared de alrededor. Una escalera de emergencia exterior de metal, revisada hace poco, tambien baja hasta la calle.',
   'dilemma',
   'Bajar por la escalera interior con grietas visibles',
   'Bajar por la escalera de emergencia exterior, revisada hace poco',
   'b'),
  ('Cafeteria en planta baja con grieta en la fachada (ejemplo simulado)',
   'Iztacalco',
   'suelo blando, ex lago',
   'Estas en una cafeteria en planta baja. Una de las dos puertas hacia la calle tiene una grieta visible en la fachada justo arriba. La otra puerta, en el extremo opuesto, no tiene ningun dano visible.',
   'dilemma',
   'Salir por la puerta bajo la grieta visible en la fachada',
   'Salir por la puerta del otro extremo, sin dano visible',
   'b')
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
