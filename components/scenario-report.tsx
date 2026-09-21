import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenarioDefinition, ScenarioSession } from "@/lib/types";

// Shown once a person has attempted every scenario in the library at least
// once. This replaces the open-ended "keep repeating a random pool" mode
// with a bounded set: do all of them, then see how it went, one row per
// scenario using the most recent attempt at it.
export function ScenarioReport({
  scenarios,
  sessions,
}: {
  scenarios: ScenarioDefinition[];
  sessions: ScenarioSession[];
}) {
  const latestByScenario = new Map<string, ScenarioSession>();
  for (const s of sessions) {
    if (!latestByScenario.has(s.scenario_id)) {
      latestByScenario.set(s.scenario_id, s);
    }
  }

  const rows = scenarios
    .map((scenario) => ({ scenario, session: latestByScenario.get(scenario.id) }))
    .filter(
      (r): r is { scenario: ScenarioDefinition; session: ScenarioSession } => r.session !== undefined,
    );

  if (rows.length === 0) {
    return null;
  }

  const correctCount = rows.filter((r) => r.session.chosen_exit === "clear").length;
  const avgReactionMs = rows.reduce((sum, r) => sum + r.session.reaction_time_ms, 0) / rows.length;

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Card className="border-muted-foreground/20 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">
            Completaste tus {rows.length} simulacros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold">
                {correctCount}/{rows.length}
              </p>
              <p className="text-muted-foreground">decisiones mas seguras</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{(avgReactionMs / 1000).toFixed(1)}s</p>
              <p className="text-muted-foreground">tiempo de reaccion promedio</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Esto no certifica que sabrias sobrevivir un sismo real. Es un resumen de
            como te fue en este conjunto de escenarios ficticios, para ver en cuales
            dudaste mas o tardaste mas.
          </p>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold">Tu resultado por escenario</h2>
      {rows.map(({ scenario, session }) => {
        const correct = session.chosen_exit === "clear";
        return (
          <Card
            key={scenario.id}
            className={correct ? "border-green-600/40 bg-green-950/10" : "border-amber-600/40 bg-amber-950/10"}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{scenario.name}</CardTitle>
                <Badge variant="outline">{(session.reaction_time_ms / 1000).toFixed(1)}s</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{session.debrief}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
