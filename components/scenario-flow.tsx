"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ScenarioCanvas } from "@/components/scenario-canvas";
import { ScenarioSimple } from "@/components/scenario-simple";
import { submitScenarioSession } from "@/app/scenario/actions";
import type { BlockedSide, ChosenExit, Intensity, ScenarioDefinition } from "@/lib/types";

export function ScenarioFlow({
  intensity,
  scenarios,
}: {
  intensity: Intensity;
  scenarios: ScenarioDefinition[];
}) {
  const [mode, setMode] = useState<"3d" | "simple">("3d");
  const [started, setStarted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scenario = useMemo(
    () => scenarios[Math.floor(Math.random() * scenarios.length)],
    [scenarios],
  );
  // Which side is blocked is randomized per run so the correct button can't
  // be memorized by position after a few repeats, it has to actually be
  // noticed each time.
  const blockedSide: BlockedSide = useMemo(
    () => (Math.random() < 0.5 ? "left" : "right"),
    [],
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

      {!started ? (
        <div
          className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center"
          style={{ minHeight: 260 }}
        >
          <p className="text-sm text-muted-foreground">
            Cuando estes listo, empieza. La alarma va a sonar en un momento
            que no vas a saber de antemano.
          </p>
          <Button type="button" onClick={() => setStarted(true)}>
            Comenzar este simulacro
          </Button>
        </div>
      ) : isPending ? (
        <p className="text-sm text-muted-foreground">Guardando tu resultado...</p>
      ) : mode === "3d" ? (
        <ScenarioCanvas intensity={intensity} blockedSide={blockedSide} onDecision={handleDecision} />
      ) : (
        <ScenarioSimple intensity={intensity} blockedSide={blockedSide} onDecision={handleDecision} />
      )}

      <p className="text-center text-xs text-muted-foreground">
        Edificio y escenario ficticios, no un lugar real. Esto no certifica
        que sepas sobrevivir un sismo real, solo mide una decision.
      </p>
    </div>
  );
}
