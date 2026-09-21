"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ChosenExit, DilemmaOption, Intensity } from "@/lib/types";

// A different kind of scenario than the corridor: no color-coded exit, no
// visual hint at all. The scenario text itself states the facts (how high
// up, what each route actually leads to), and the two buttons are styled
// identically on purpose, correctness has to come from reading the
// situation, not from spotting the green shape. Same unannounced timing and
// reaction-time measurement underneath, so it plugs into the same debrief
// and history as the corridor scenarios.
export function ScenarioDilemma({
  intensity,
  optionALabel,
  optionBLabel,
  correctOption,
  onDecision,
}: {
  intensity: Intensity;
  optionALabel: string;
  optionBLabel: string;
  correctOption: DilemmaOption;
  onDecision: (exit: ChosenExit, reactionTimeMs: number) => void;
}) {
  const alarmFiredAtRef = useRef<number | null>(null);
  const decidedRef = useRef(false);
  const [alarm, setAlarm] = useState(false);
  const [elapsedLabel, setElapsedLabel] = useState("0.0");

  useEffect(() => {
    const delayMs = 2500 + Math.random() * 3500;
    const timeout = setTimeout(() => {
      alarmFiredAtRef.current = performance.now();
      setAlarm(true);
    }, delayMs);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!alarm) return;
    const id = setInterval(() => {
      if (alarmFiredAtRef.current === null) return;
      setElapsedLabel(((performance.now() - alarmFiredAtRef.current) / 1000).toFixed(1));
    }, 100);
    return () => clearInterval(id);
  }, [alarm]);

  function choose(option: DilemmaOption) {
    if (decidedRef.current || alarmFiredAtRef.current === null) return;
    decidedRef.current = true;
    const exit: ChosenExit = option === correctOption ? "clear" : "blocked";
    onDecision(exit, performance.now() - alarmFiredAtRef.current);
  }

  return (
    <div
      className={`w-full rounded-lg border p-8 text-center ${
        alarm
          ? intensity === "low"
            ? "border-amber-600 bg-amber-950/20"
            : "border-red-600 bg-red-950/20"
          : "border-border"
      }`}
      style={{ minHeight: 260 }}
    >
      {!alarm ? (
        <p className="text-muted-foreground">
          Piensa en las dos opciones de arriba. Espera la senal...
        </p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-bold">Decide ahora. {elapsedLabel}s</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="whitespace-normal" onClick={() => choose("a")}>
              {optionALabel}
            </Button>
            <Button variant="outline" className="whitespace-normal" onClick={() => choose("b")}>
              {optionBLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
