import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY no está configurada. Definila en .env para habilitar las funciones de IA de Aulera."
    );
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const AULERA_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

// Every prompt in Aulera includes this rule: the model must never present its
// output as a finished decision, and must never invent normative/curricular
// claims that aren't grounded in either (a) the teacher's own documents or
// (b) general pedagogical knowledge stated as such.
export const AULERA_SYSTEM_PROMPT = `Sos el asistente pedagógico de Aulera, una herramienta para docentes argentinos que arman planificaciones de clase.

Reglas estrictas:
1. Todo lo que generes es una SUGERENCIA, nunca una decisión tomada. El docente tiene que poder revisar, editar y aprobar cada parte antes de que se considere definitiva.
2. Nunca inventes contenido normativo (diseños curriculares, resoluciones, NAP, leyes de educación) como si fuera un hecho verificado. Si se te da contexto de documentos institucionales cargados por el docente, basate en ese texto y citá de dónde sale. Si NO hay documentos cargados, aclaralo y apoyate en conocimiento pedagógico general, dejando explícito que no reemplaza la normativa jurisdiccional vigente.
3. Respondé siempre en español rioplatense, tono profesional y cercano, sin tecnicismos innecesarios.
4. Cuando te pidan JSON, devolvé JSON válido y nada más (sin texto extra, sin markdown fences).`;

export async function callClaude(params: {
  system?: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}) {
  const anthropic = getAnthropicClient();
  try {
    const response = await anthropic.messages.create({
      model: AULERA_MODEL,
      max_tokens: params.maxTokens ?? 4096,
      system: params.system ?? AULERA_SYSTEM_PROMPT,
      messages: params.messages,
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text : "";
  } catch (err) {
    // Log the raw error server-side (visible in Vercel runtime logs) so it
    // stays diagnosable, but never show a docente a raw API/JSON error.
    console.error("[anthropic] callClaude failed:", err);
    throw new Error(friendlyClaudeError(err));
  }
}

function friendlyClaudeError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const message = String(err.error && typeof err.error === "object" && "error" in err.error
      ? (err.error as { error?: { message?: string } }).error?.message ?? ""
      : "");

    if (err.status === 400 && /credit balance/i.test(message)) {
      return "Aulera no puede generar sugerencias en este momento: no hay crédito disponible en la cuenta de IA. Avisale al administrador de la plataforma para que cargue crédito.";
    }
    if (err.status === 401) {
      return "Aulera no puede generar sugerencias en este momento: la clave de acceso a la IA no es válida. Avisale al administrador de la plataforma.";
    }
    if (err.status === 429) {
      return "Aulera está recibiendo muchos pedidos en este momento. Esperá un minuto y volvé a intentar.";
    }
    if (err.status && err.status >= 500) {
      return "El servicio de IA no está respondiendo en este momento. Volvé a intentar en unos minutos.";
    }
  }
  return "No se pudo generar la sugerencia. Volvé a intentar en unos minutos; si el problema sigue, avisale al administrador de la plataforma.";
}

// Strips accidental ```json fences and parses. Throws with the raw text on failure
// so callers can decide how to surface a bad-generation error to the teacher.
export function parseClaudeJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `No se pudo interpretar la respuesta de Claude como JSON: ${(err as Error).message}\n${raw.slice(0, 500)}`
    );
  }
}
