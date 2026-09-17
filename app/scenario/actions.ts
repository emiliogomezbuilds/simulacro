"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { generateDebrief } from "@/lib/debrief";
import type { ChosenExit, Intensity } from "@/lib/types";

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
  scenarioName: string;
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
  // nothing raw lands in the database or the model prompt.
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
  const scenarioName = String(input.scenarioName ?? "el escenario").slice(0, 200);

  const { text: debrief, method } = await generateDebrief(
    input.chosenExit,
    reactionTimeMs,
    scenarioName,
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
