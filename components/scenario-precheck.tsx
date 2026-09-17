"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { savePretestAnswer } from "@/app/scenario/actions";

export function ScenarioPrecheck() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Antes de empezar, una pregunta privada</CardTitle>
        <CardDescription>
          Nadie mas ve tu respuesta, ni tu escuela, ni el equipo. Solo se usa
          para ajustar la intensidad de lo que vas a ver.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-sm">
          Has vivido personalmente el derrumbe de un edificio, o has quedado
          atrapado en un sismo?
        </p>
        <div className="flex gap-3">
          <form action={savePretestAnswer}>
            <input type="hidden" name="prior_trauma" value="yes" />
            <Button type="submit" variant="outline" size="lg">
              Si
            </Button>
          </form>
          <form action={savePretestAnswer}>
            <input type="hidden" name="prior_trauma" value="no" />
            <Button type="submit" size="lg">
              No
            </Button>
          </form>
        </div>
        <p className="text-xs text-muted-foreground">
          Una respuesta &quot;si&quot; no te excluye del simulacro. Solo
          activa una version de menor intensidad, sin que nadie mas lo sepa.
        </p>
      </CardContent>
    </Card>
  );
}
