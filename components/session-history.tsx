import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenarioSession } from "@/lib/types";

export function SessionHistory({ sessions }: { sessions: ScenarioSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavia no has hecho ningun simulacro.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <h2 className="text-lg font-semibold">Tus simulacros</h2>
      {sessions.map((s) => {
        const correct = s.chosen_exit === "clear";
        return (
          <Card
            key={s.id}
            className={correct ? "border-green-600/40 bg-green-950/10" : "border-amber-600/40 bg-amber-950/10"}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {s.scenario_definitions?.name ?? "Escenario"}
                </CardTitle>
                <Badge variant="outline">{(s.reaction_time_ms / 1000).toFixed(1)}s</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">{s.debrief}</p>
              <p className="text-[11px] text-muted-foreground">
                {s.debrief_method === "ai" ? "Retroalimentacion asistida por IA." : "Retroalimentacion generada por reglas fijas."}
                {" "}Intensidad: {s.intensity === "low" ? "reducida" : "estandar"}.
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
