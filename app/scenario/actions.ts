"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { generateDebrief } from "@/lib/debrief";
import type { ChosenExit, Intensity, ScenarioDefinition } from "@/lib/types";

// Derives the human-readable phrase for whatever the person actually chose,
// from the scenario's own authoritative data, never from client-supplied
// text. Corridor scenarios keep the original "salida clara / bloqueada"
// wording; dilemma scenarios use the scenario's own option labels so the
// debrief reads naturally either way.
function deriveChosenLabel(scenario: ScenarioDefinition, chosenExit: ChosenExit): string {
  if (scenario.scenario_type === "dilemma") {
    const correct = chosenExit === "clear";
    const correctLabel = scenario.correct_option === "a" ? scenario.option_a_label : scenario.option_b_label;
    const wrongLabel = scenario.correct_option === "a" ? scenario.option_b_label : scenario.option_a_label;
    return (correct ? correctLabel : wrongLabel) ?? (correct ? "la opcion mas segura" : "la otra opcion");
  }
  return chosenExit === "clear" ? "la salida clara" : "la salida bloqueada";
}

export async function savePretestAnswer(formData: FormData) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    redirect("/auth/login");
  }

  const userId = auth.claims.sub as string;
  const priorTrauma = formData.get("prior_trauma") === "yes";

  const { error } = await supabase
    .from("pretest_answers")
    .upsert({ user_id: userId, prior_trauma: priorTrauma }, { onConflict: "user_id" });

  if (error) {
    redirect("/scenario?error=No pudimos guardar tu respuesta. Intenta de nuevo.");
  }

  revalidatePath("/scenario");
}

export async function submitScenarioSession(input: {
  scenarioId: string;
  intensity: Intensity;
  chosenExit: ChosenExit;
  reactionTimeMs: number;
}) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    redirect("/auth/login");
  }

  const userId = auth.claims.sub as string;

  // Every input from the client is validated server-side (security floor):
  // nothing raw lands in the database or the model prompt. The scenario
  // name and option labels are looked up from the database by id below,
  // never trusted from the client, so a tampered client can't put arbitrary
  // text in front of the debrief model.
  if (!input.scenarioId || typeof input.scenarioId !== "string") {
    redirect("/scenario?error=Escenario invalido. Intenta de nuevo.");
  }
  if (input.intensity !== "standard" && input.intensity !== "low") {
    redirect("/scenario?error=Intensidad invalida. Intenta de nuevo.");
  }
  if (input.chosenExit !== "blocked" && input.chosenExit !== "clear") {
    redirect("/scenario?error=Decision invalida. Intenta de nuevo.");
  }
  const reactionTimeMs = Math.round(Number(input.reactionTimeMs));
  if (!Number.isFinite(reactionTimeMs) || reactionTimeMs < 0 || reactionTimeMs > 120000) {
    redirect("/scenario?error=Tiempo de reaccion invalido. Intenta de nuevo.");
  }

  const { data: scenarioRow, error: scenarioError } = await supabase
    .from("scenario_definitions")
    .select("*")
    .eq("id", input.scenarioId)
    .maybeSingle();

  if (scenarioError || !scenarioRow) {
    redirect("/scenario?error=Escenario invalido. Intenta de nuevo.");
    return;
  }

  const scenario = scenarioRow as ScenarioDefinition;
  const chosenLabel = deriveChosenLabel(scenario, input.chosenExit);

  const { text: debrief, method } = await generateDebrief(
    input.chosenExit,
    chosenLabel,
    reactionTimeMs,
    scenario.name,
  );

  const { data: inserted, error: insertError } = await supabase
    .from("scenario_sessions")
    .insert({
      user_id: userId,
      scenario_id: input.scenarioId,
      intensity: input.intensity,
      chosen_exit: input.chosenExit,
      reaction_time_ms: reactionTimeMs,
      debrief,
      debrief_method: method,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    redirect("/scenario?error=No pudimos guardar tu resultado. Intenta de nuevo en unos minutos.");
  }

  revalidatePath("/scenario");
  redirect(`/scenario?submitted=${inserted.id}`);
}
