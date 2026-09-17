import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { ScenarioPrecheck } from "@/components/scenario-precheck";
import { ScenarioFlow } from "@/components/scenario-flow";
import { SessionHistory } from "@/components/session-history";
import type { Intensity, PretestAnswer, ScenarioDefinition, ScenarioSession } from "@/lib/types";

// Cache Components (next.config.ts: cacheComponents: true): anything that
// reads cookies/session lives in its own async component wrapped in
// <Suspense>, same working pattern as amparo/comprobante.
async function ScenarioContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    redirect("/auth/login");
  }

  const userId = auth.claims.sub as string;
  const { error, submitted } = await searchParams;

  const [{ data: pretestRaw }, { data: scenariosRaw }, { data: sessionsRaw }] = await Promise.all([
    supabase.from("pretest_answers").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("scenario_definitions").select("*"),
    supabase
      .from("scenario_sessions")
      .select("*, scenario_definitions(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const pretest = pretestRaw as PretestAnswer | null;
  const scenarios = (scenariosRaw ?? []) as ScenarioDefinition[];
  const sessions = (sessionsRaw ?? []) as ScenarioSession[];
  const intensity: Intensity = pretest?.prior_trauma ? "low" : "standard";

  return (
    <>
      <div className="flex w-full max-w-lg items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Simulacro</h1>
          <p className="text-sm text-muted-foreground">
            Brigada escolar, un simulacro que se mide de verdad
          </p>
        </div>
        <LogoutButton />
      </div>

      {error && <p className="w-full max-w-lg text-sm text-red-500">{error}</p>}
      {submitted && (
        <p className="w-full max-w-lg text-sm text-green-600">
          Resultado guardado, mira tu retroalimentacion abajo.
        </p>
      )}

      {!pretest ? (
        <ScenarioPrecheck />
      ) : (
        <ScenarioFlow intensity={intensity} scenarios={scenarios} />
      )}

      <SessionHistory sessions={sessions} />
    </>
  );
}

export default function ScenarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center gap-8 p-8">
      <Suspense fallback={<div className="h-9 w-full max-w-lg" />}>
        <ScenarioContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
