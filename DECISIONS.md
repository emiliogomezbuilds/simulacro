# Simulacro, Session 1 log

Week 6 Business Bending build, OPERATOR role, Team 2. This log follows the same
format used for Amparo's Session 1 log in Week 5.

## What this is

Simulacro is a standardized brigade training scenario library for one soft
soil school. It is the individual build that carries forward Team 2's
finalized Week 6 Blueprint: a fictional building and scenario only (Condition
1, shadow clause), a private trauma pre check that silently routes intensity
without ever showing the label to the user (Condition 2), decision and
reaction time logged with no biometric, facial, or emotional capture
(Condition 3), a specific and rubric based debrief that never implies
certification (Condition 4), and unverified claims stated plainly in the
interface copy rather than implied as proven (Condition 6).

## What was built this session

- Full Next.js 16 app scaffold, Cache Components enabled, mirroring the
  working Amparo and Comprobante pattern for auth, layout, and Supabase
  client and server helpers.
- `lib/types.ts` and `lib/debrief.ts`, the ML and adaptive logic layer. It
  tries a Gemini call first, then falls back to a rule based debrief when no
  key is set or the call fails.
- `supabase/schema.sql` with three tables, `scenario_definitions`,
  `pretest_answers`, and `scenario_sessions`, row level security policies on
  each, and explicit table level grants written in from the start. This is a
  direct fix for a real bug hit last week in Amparo: Supabase's automatically
  expose new tables setting, left unchecked at project creation, blocks all
  PostgREST access with a blanket 403 no matter how correct the row level
  policies are, because it is a table level grant problem, not a row level
  one. The comment in the schema file names this bug so it is not repeated a
  third time.
- `components/scenario-canvas.tsx`, a real, working Three.js 3D scene. This
  is the simulation and 3D layer of this week's required dragon stack. It
  renders a corridor with a blocked exit and a clear exit, fires an alarm at
  an unpredictable moment rather than a fixed countdown, and times the
  person's reaction with `performance.now()` so no server round trip can
  distort the measurement.
- `components/scenario-simple.tsx`, the fully legitimate non VR alternative
  required by Condition 2, same timing mechanic, plain text and CSS only.
- `components/scenario-flow.tsx`, `scenario-precheck.tsx`, and
  `session-history.tsx`, plus `app/scenario/actions.ts` and
  `app/scenario/page.tsx`, wiring the pre check, the scenario choice, the
  server action that validates input and calls the debrief function, and the
  aggregate only session history.
- Verified locally: `npm install` succeeded with 458 packages and 0
  vulnerabilities. `npx next build` compiled cleanly with all 6 routes
  generating correctly under Cache Components. `npx eslint .` now returns 0
  warnings and 0 errors.

## What is open, honestly

- No `GEMINI_API_KEY` is set anywhere in this project yet, so the debrief
  function will run on its rule based path in every real session, exactly
  like Amparo's real production state last week. This is disclosed in the
  packet, not hidden.
- No Supabase project has been created for this app yet. The schema is
  written and ready to run, but it has not touched a real database.
- No GitHub repository exists yet for this project. Git has not been
  initialized until this same session.
- No deploy has happened. There is no live URL yet.
- No mechanical or persona test pass has happened yet, because there is
  nothing live to test against.
- No real VR hardware was tested this week, matching the packet's own scope
  cut. The 3D scene is WebXR compatible in principle but only verified in a
  normal browser tab.

## Next steps

1. Emilio creates the GitHub repository, the Supabase project, and connects
   Vercel, and reuses the shared Google OAuth client already set up for
   Amparo, Comprobante, Escudo, and Cuaderno with one more redirect URI added.
2. Push this local repository, run the schema in the new Supabase project,
   set real environment variables in Vercel, deploy.
3. Mechanical test pass on the live URL, fix at least one real bug found,
   redeploy.
4. Persona test pass against Profesor Raul, log confusions, fix the worst
   one.
5. Record the demo video and assemble the final delivery bundle.
