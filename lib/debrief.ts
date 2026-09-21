import { GoogleGenAI } from "@google/genai";
import type { ChosenExit, DebriefResult } from "@/lib/types";

// Business Bending slice: the AI-assisted debrief is the "ML, adaptive logic"
// layer that makes this build multiplicative with the 3D simulation, not just
// two features bolted together, the debrief text depends directly on what
// actually happened in the scene (which option, how fast). The AI is never
// the judge of pass or fail, that stays a fixed rubric; the AI only explains
// it in plain language. When no GEMINI_API_KEY is set, ruleBasedDebrief()
// below is the real, deterministic fallback that runs in production,
// matching the same defensive pattern used in escudo and amparo.
//
// chosenLabel is the human-readable phrase for whatever the person actually
// picked ("la salida clara" for a corridor scenario, or "salir por la puerta
// trasera hacia la escalera de emergencia" for a dilemma scenario), decided
// server-side from the scenario definition so this works the same way for
// both scenario types without hardcoding "salida" wording everywhere.
function ruleBasedDebrief(
  chosenLabel: string,
  correct: boolean,
  reactionTimeMs: number,
  scenarioName: string,
): string {
  const seconds = (reactionTimeMs / 1000).toFixed(1);

  if (correct && reactionTimeMs <= 4000) {
    return `Elegiste ${chosenLabel} en ${seconds} segundos, en ${scenarioName}. Esa es la decision mas segura en este escenario y el tiempo es bueno. Lo unico que vale la pena practicar es no dudar antes de moverte, cada segundo cuenta.`;
  }
  if (correct) {
    return `Elegiste ${chosenLabel} en ${seconds} segundos, en ${scenarioName}. La decision fue la mas segura, pero el tiempo de reaccion fue lento. Practica reconocer la senal de alarma y decidir de inmediato, sin confirmar dos veces.`;
  }
  return `Elegiste ${chosenLabel} en ${seconds} segundos, en ${scenarioName}. Segun los datos de este escenario, esa no era la opcion mas segura. Vale la pena repetir este escenario y leer de nuevo las dos opciones antes de decidir.`;
}

export async function generateDebrief(
  chosenExit: ChosenExit,
  chosenLabel: string,
  reactionTimeMs: number,
  scenarioName: string,
): Promise<DebriefResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const correct = chosenExit === "clear";

  if (!apiKey) {
    return { text: ruleBasedDebrief(chosenLabel, correct, reactionTimeMs, scenarioName), method: "rule-based" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction =
      "Eres un asistente que da retroalimentacion breve y honesta a una persona " +
      "que acaba de hacer un simulacro de evacuacion. Nunca inventas que la persona " +
      "sobrevivio o que esto certifica algo real. Escribe en espanol, en 2 a 3 " +
      "oraciones, en un tono directo y humano, nunca generico. Menciona la opcion " +
      "que eligio y el tiempo de reaccion.";

    const input =
      `Escenario: "${scenarioName}". Opcion elegida: "${chosenLabel}". ` +
      `Tiempo de reaccion: ${(reactionTimeMs / 1000).toFixed(1)} segundos. ` +
      `${correct ? "Esta fue la decision mas segura en este escenario." : "Esta NO fue la decision mas segura en este escenario."}`;

    const interaction = await ai.interactions.create({
      model: "gemini-3.7-flash",
      system_instruction: systemInstruction,
      input,
    });

    const text = (interaction.output_text ?? "").trim();
    if (text) {
      return { text, method: "ai" };
    }
  } catch {
    // Network/API error, fall through to the deterministic fallback below.
  }

  return { text: ruleBasedDebrief(chosenLabel, correct, reactionTimeMs, scenarioName), method: "rule-based" };
}
