"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  // Which side is blocked, decided fresh at the moment the person clicks
  // Comenzar, not when the component first renders. A soft navigation after
  // submitting a decision can reuse this same component instance instead of
  // remounting it, so a mount-time random pick could stay locked in across
  // several real attempts in one sitting, exactly when memorization is the
  // biggest risk. Deciding it inside handleStart guarantees a fresh coin
  // flip every single attempt regardless of what React reuses underneath.
  const [blockedSide, setBlockedSide] = useState<BlockedSide>(() =>
    Math.random() < 0.5 ? "left" : "right",
  );

  function handleStart() {
    setBlockedSide(Math.random() < 0.5 ? "left" : "right");
    setStarted(true);
  }

  // After a decision is submitted, the server action redirects back to this
  // same route with a new scenario picked, but React can reuse this same
  // client component instance rather than remounting it, real bug found
  // testing this: once "started" flips true it stayed true forever, so
  // every attempt after the very first one skipped the Comenzar prompt and
  // the blockedSide coin flip entirely. Resetting on scenario.id change
  // makes every new scenario require its own explicit start and its own
  // fresh random side.
  useEffect(() => {
    setStarted(false);
  }, [scenario?.id]);

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
          <Button type="button" onClick={handleStart}>
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
