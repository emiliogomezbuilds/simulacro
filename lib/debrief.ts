import { GoogleGenAI } from "@google/genai";
import type { ChosenExit, DebriefResult } from "@/lib/types";

// Business Bending slice: the AI-assisted debrief is the "ML, adaptive logic"
// layer that makes this build multiplicative with the 3D simulation, not just
// two features bolted together, the debrief text depends directly on what
// actually happened in the scene (which exit, how fast). The AI is never the
// judge of pass or fail, that stays a fixed rubric; the AI only explains it in
// plain language. When no GEMINI_API_KEY is set, ruleBasedDebrief() below is
// the real, deterministic fallback that runs in production, matching the same
// defensive pattern used in escudo and amparo.
function ruleBasedDebrief(
  chosenExit: ChosenExit,
  reactionTimeMs: number,
  scenarioName: string,
): string {
  const seconds = (reactionTimeMs / 1000).toFixed(1);
  const correct = chosenExit === "clear";

  if (correct && reactionTimeMs <= 4000) {
    return `Elegiste la salida clara en ${seconds} segundos, en ${scenarioName}. Esa es la decision correcta y el tiempo es bueno. Lo unico que vale la pena practicar es no dudar antes de moverte, cada segundo cuenta.`;
  }
  if (correct) {
    return `Elegiste la salida clara en ${seconds} segundos, en ${scenarioName}. La decision fue correcta, pero el tiempo de reaccion fue lento. Practica reconocer la senal de alarma y moverte de inmediato, sin confirmar dos veces.`;
  }
  return `Elegiste la salida bloqueada en ${seconds} segundos, en ${scenarioName}. En una salida real bloqueada, esto significa perder tiempo valioso antes de corregir el rumbo. Vale la pena repetir este escenario y practicar revisar ambas salidas antes de decidir.`;
}

export async function generateDebrief(
  chosenExit: ChosenExit,
  reactionTimeMs: number,
  scenarioName: string,
): Promise<DebriefResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { text: ruleBasedDebrief(chosenExit, reactionTimeMs, scenarioName), method: "rule-based" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction =
      "Eres un asistente que da retroalimentacion breve y honesta a una persona " +
      "que acaba de hacer un simulacro de evacuacion. Nunca inventas que la persona " +
      "sobrevivio o que esto certifica algo real. Escribe en espanol, en 2 a 3 " +
      "oraciones, en un tono directo y humano, nunca generico. Menciona la salida " +
      "que eligio y el tiempo de reaccion.";

    const input =
      `Escenario: "${scenarioName}". Salida elegida: "${chosenExit === "clear" ? "la salida clara" : "la salida bloqueada"}". ` +
      `Tiempo de reaccion: ${(reactionTimeMs / 1000).toFixed(1)} segundos. ` +
      `${chosenExit === "clear" ? "Esta fue la decision correcta." : "Esta NO fue la decision correcta, la salida elegida estaba bloqueada."}`;

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

  return { text: ruleBasedDebrief(chosenExit, reactionTimeMs, scenarioName), method: "rule-based" };
}
