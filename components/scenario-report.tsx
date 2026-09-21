import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenarioDefinition, ScenarioSession } from "@/lib/types";

type Row = { scenario: ScenarioDefinition; session: ScenarioSession };

function typeLabel(type: string): string {
  return type === "dilemma" ? "dilemas (opciones escritas)" : "pasillos (reconocer la escena)";
}

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

  const allRows: Row[] = scenarios
    .map((scenario) => ({ scenario, session: latestByScenario.get(scenario.id) }))
    .filter((r): r is Row => r.session !== undefined);

  if (allRows.length === 0) {
    return null;
  }

  const correctCount = allRows.filter((r) => r.session.chosen_exit === "clear").length;
  const avgReactionMs = allRows.reduce((sum, r) => sum + r.session.reaction_time_ms, 0) / allRows.length;

  // Different scenario types test different skills, fast visual pattern
  // recognition versus reading and judgment, averaging them together can
  // hide a real gap between the two, so break it out by type whenever more
  // than one type is present.
  const byType = new Map<string, Row[]>();
  for (const row of allRows) {
    const key = row.scenario.scenario_type;
    byType.set(key, [...(byType.get(key) ?? []), row]);
  }

  const fastest = allRows.reduce((a, b) => (a.session.reaction_time_ms <= b.session.reaction_time_ms ? a : b));
  const slowest = allRows.reduce((a, b) => (a.session.reaction_time_ms >= b.session.reaction_time_ms ? a : b));

  // Worst first: wrong decisions before correct ones, slowest before
  // fastest within each group, so the report reads like something to act
  // on rather than a flat, arbitrarily ordered list.
  const rows = [...allRows].sort((a, b) => {
    const aCorrect = a.session.chosen_exit === "clear";
    const bCorrect = b.session.chosen_exit === "clear";
    if (aCorrect !== bCorrect) return aCorrect ? 1 : -1;
    return b.session.reaction_time_ms - a.session.reaction_time_ms;
  });

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Card className="border-muted-foreground/20 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">
            Completaste tus {allRows.length} simulacros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold">
                {correctCount}/{allRows.length}
              </p>
              <p className="text-muted-foreground">decisiones mas seguras</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{(avgReactionMs / 1000).toFixed(1)}s</p>
              <p className="text-muted-foreground">tiempo de reaccion promedio</p>
            </div>
          </div>

          {byType.size > 1 && (
            <div className="flex flex-col gap-1 border-t pt-3 text-sm">
              {[...byType.entries()].map(([type, typeRows]) => {
                const typeCorrect = typeRows.filter((r) => r.session.chosen_exit === "clear").length;
                const typeAvgMs =
                  typeRows.reduce((sum, r) => sum + r.session.reaction_time_ms, 0) / typeRows.length;
                return (
                  <p key={type} className="text-muted-foreground">
                    En {typeLabel(type)}: {typeCorrect}/{typeRows.length} correctas, {(typeAvgMs / 1000).toFixed(1)}s
                    de tiempo promedio.
                  </p>
                );
              })}
            </div>
          )}

          <p className="text-sm">
            Tu decision mas rapida fue en &quot;{fastest.scenario.name}&quot; (
            {(fastest.session.reaction_time_ms / 1000).toFixed(1)}s). La mas lenta fue en &quot;
            {slowest.scenario.name}&quot; ({(slowest.session.reaction_time_ms / 1000).toFixed(1)}s).
          </p>

          <p className="text-xs text-muted-foreground">
            Esto no certifica que sabrias sobrevivir un sismo real. Es un resumen de
            como te fue en este conjunto de escenarios, para ver en cuales dudaste
            mas o tardaste mas.
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
