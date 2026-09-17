"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ScenarioCanvas } from "@/components/scenario-canvas";
import { ScenarioSimple } from "@/components/scenario-simple";
import { submitScenarioSession } from "@/app/scenario/actions";
import type { ChosenExit, Intensity, ScenarioDefinition } from "@/lib/types";

export function ScenarioFlow({
  intensity,
  scenarios,
}: {
  intensity: Intensity;
  scenarios: ScenarioDefinition[];
}) {
  const [mode, setMode] = useState<"3d" | "simple">("3d");
  const [isPending, startTransition] = useTransition();
  const scenario = useMemo(
    () => scenarios[Math.floor(Math.random() * scenarios.length)],
    [scenarios],
  );

  function handleDecision(exit: ChosenExit, reactionTimeMs: number) {
    startTransition(() => {
      submitScenarioSession({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        intensity,
        chosenExit: exit,
        reactionTimeMs,
      });
    });
  }

  if (!scenario) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavia no hay escenarios cargados.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{scenario.name}</h2>
          <p className="text-xs text-muted-foreground">
            {scenario.colonia}, {scenario.soil_type}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMode(mode === "3d" ? "simple" : "3d")}
        >
          {mode === "3d" ? "Prefiero la version sin animacion" : "Usar la version 3D"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{scenario.description}</p>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Guardando tu resultado...</p>
      ) : mode === "3d" ? (
        <ScenarioCanvas intensity={intensity} onDecision={handleDecision} />
      ) : (
        <ScenarioSimple intensity={intensity} onDecision={handleDecision} />
      )}

      <p className="text-center text-xs text-muted-foreground">
        Edificio y escenario ficticios, no un lugar real. Esto no certifica
        que sepas sobrevivir un sismo real, solo mide una decision.
      </p>
    </div>
  );
}
