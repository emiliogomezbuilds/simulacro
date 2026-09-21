"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BlockedSide, ChosenExit, Intensity } from "@/lib/types";

// Condition 2's non-VR alternative: a fully legitimate, non-immersive path
// that never gets treated as the lesser option. Same real mechanism, same
// unannounced timing, same measured reaction time, no 3D rendering.
export function ScenarioSimple({
  intensity,
  blockedSide,
  onDecision,
}: {
  intensity: Intensity;
  blockedSide: BlockedSide;
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

  function choose(exit: ChosenExit) {
    if (decidedRef.current || alarmFiredAtRef.current === null) return;
    decidedRef.current = true;
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
        <p className="text-muted-foreground">Version sin animacion. Espera la alarma...</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-bold">
            ALARMA. La salida principal esta bloqueada. Elige que hacer. {elapsedLabel}s
          </p>
          <div className="flex gap-3">
            {blockedSide === "left" ? (
              <>
                <Button variant="destructive" onClick={() => choose("blocked")}>
                  Ir por la salida bloqueada de todos modos
                </Button>
                <Button className="bg-green-700 hover:bg-green-800" onClick={() => choose("clear")}>
                  Ir por la salida alterna clara
                </Button>
              </>
            ) : (
              <>
                <Button className="bg-green-700 hover:bg-green-800" onClick={() => choose("clear")}>
                  Ir por la salida alterna clara
                </Button>
                <Button variant="destructive" onClick={() => choose("blocked")}>
                  Ir por la salida bloqueada de todos modos
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
