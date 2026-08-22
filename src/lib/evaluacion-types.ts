import type { EstadoContenido, ChatMensaje } from "@/lib/planificacion-types";

export type { ChatMensaje };

// The evaluación's content is a single free-written document (like a Word
// page) instead of the structured multi-field shapes used by the planning
// wizard — the teacher writes it directly, in their own words.
export type EvaluacionContenido = {
  texto: string;
  estado: EstadoContenido;
  chat: ChatMensaje[];
};
