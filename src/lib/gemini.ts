import { GoogleGenAI, ApiError } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY no está configurada. Definila en .env para habilitar las funciones de IA de Aulera."
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

// Flash: el modelo del nivel gratuito de la API de Gemini (sin tarjeta).
export const AULERA_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

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

export async function callGemini(params: {
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  jsonMode?: boolean;
}) {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: AULERA_MODEL,
      contents: params.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: params.system ?? AULERA_SYSTEM_PROMPT,
        maxOutputTokens: params.maxTokens ?? 4096,
        ...(params.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    });
    return response.text ?? "";
  } catch (err) {
    // Log the raw error server-side (visible in Vercel runtime logs) so it
    // stays diagnosable, but never show a docente a raw API/JSON error.
    console.error("[gemini] callGemini failed:", err);
    throw new Error(friendlyGeminiError(err));
  }
}

function friendlyGeminiError(err: unknown): string {
  if (err instanceof ApiError) {
    const message = err.message ?? "";

    if (err.status === 429 || /quota|resource_exhausted/i.test(message)) {
      return "Aulera está recibiendo muchos pedidos en este momento (o se agotó la cuota gratuita del día). Esperá un minuto y volvé a intentar.";
    }
    if (err.status === 400 && /api key not valid|api_key_invalid/i.test(message)) {
      return "Aulera no puede generar sugerencias en este momento: la clave de acceso a la IA no es válida. Avisale al administrador de la plataforma.";
    }
    if (err.status === 403) {
      return "Aulera no puede generar sugerencias en este momento: la clave de acceso a la IA no tiene permiso. Avisale al administrador de la plataforma.";
    }
    if (err.status && err.status >= 500) {
      return "El servicio de IA no está respondiendo en este momento. Volvé a intentar en unos minutos.";
    }
  }
  return "No se pudo generar la sugerencia. Volvé a intentar en unos minutos; si el problema sigue, avisale al administrador de la plataforma.";
}

// Strips accidental ```json fences and parses. Throws with the raw text on failure
// so callers can decide how to surface a bad-generation error to the teacher.
export function parseGeminiJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `No se pudo interpretar la respuesta de la IA como JSON: ${(err as Error).message}\n${raw.slice(0, 500)}`
    );
  }
}
