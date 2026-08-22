import { callGemini, parseGeminiJson } from "@/lib/gemini";
import type { EvaluacionContenido } from "@/lib/evaluacion-types";

type ContextoEvaluacion = {
  titulo: string;
  tipo: string | null;
  contextoPlanificacion: string;
  textoDocumentos: string;
};

function contextoPlanificacionBloque(contextoPlanificacion: string) {
  if (!contextoPlanificacion.trim()) {
    return "Esta evaluación no está vinculada a ninguna planificación con contenido aprobado.";
  }
  return `Contenido ya aprobado de la planificación vinculada (usalo como base para que la evaluación sea coherente con lo que se enseñó):\n---\n${contextoPlanificacion}\n---`;
}

function documentosBloque(textoDocumentos: string) {
  if (!textoDocumentos.trim()) {
    return "No hay documentos institucionales cargados para tomar como fuente. Basate en conocimiento pedagógico general y dejalo explícito al principio del texto.";
  }
  return `Documentos institucionales cargados por el docente (usalos como fuente principal y citá de dónde sale cada cosa):\n---\n${textoDocumentos.slice(0, 12000)}\n---`;
}

export async function generarContenidoEvaluacion(ctx: ContextoEvaluacion): Promise<EvaluacionContenido> {
  const raw = await callGemini({
    jsonMode: true,
    messages: [
      {
        role: "user",
        content: `Redactá un borrador completo para una evaluación que el docente va a revisar y editar libremente, como si fuera una hoja de un procesador de texto (consignas, preguntas, criterios de corrección — lo que corresponda según el tipo de evaluación).

Título de la evaluación: ${ctx.titulo}
Tipo: ${ctx.tipo ?? "no especificado"}

${contextoPlanificacionBloque(ctx.contextoPlanificacion)}

${documentosBloque(ctx.textoDocumentos)}

Devolvé SOLO este JSON (sin markdown, sin texto extra):
{
  "texto": string /* el contenido completo de la evaluación, en texto plano con saltos de línea, listo para editar */,
  "estado": "sugerencia",
  "chat": []
}`,
      },
    ],
  });
  return parseGeminiJson<EvaluacionContenido>(raw);
}

export async function ajustarContenidoEvaluacion(
  actual: EvaluacionContenido,
  mensaje: string
): Promise<EvaluacionContenido> {
  const raw = await callGemini({
    jsonMode: true,
    messages: [
      {
        role: "user",
        content: `Este es el JSON actual del contenido de una evaluación:
${JSON.stringify(actual)}

El docente pide este ajuste: "${mensaje}"

Aplicá el ajuste directamente sobre el texto y devolvé el JSON completo actualizado con la MISMA forma (texto, estado, chat). Marcá "estado": "editado". Agregá al array "chat" los dos mensajes nuevos: { "from": "user", "texto": "${mensaje.replace(/"/g, '\\"')}" } y un { "from": "aulera", "texto": "<resumen breve y concreto de qué cambiaste>" }. Devolvé SOLO el JSON.`,
      },
    ],
  });
  return parseGeminiJson<EvaluacionContenido>(raw);
}
