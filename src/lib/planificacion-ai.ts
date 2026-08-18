import { callClaude, parseClaudeJson } from "@/lib/anthropic";
import type {
  ObjetivosContenidos,
  MetodologiaActividades,
  InstrumentoEvaluacion,
  CoherenciaReporte,
} from "@/lib/planificacion-types";

type ContextoPlan = {
  materia: string | null;
  curso: string | null;
  provincia: string | null;
  modalidad: string | null;
  contextoLibre: string | null;
};

function contextoBase(plan: ContextoPlan) {
  return [
    plan.materia ? `Materia: ${plan.materia}` : null,
    plan.curso ? `Curso/año: ${plan.curso}` : null,
    plan.provincia ? `Provincia: ${plan.provincia}` : null,
    plan.modalidad ? `Modalidad: ${plan.modalidad}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function documentosBloque(textoDocumentos: string) {
  if (!textoDocumentos.trim()) {
    return "No hay documentos institucionales cargados para esta planificación. Basate en conocimiento pedagógico general y dejalo explícito en el campo `fuente.nota`.";
  }
  return `Documentos institucionales cargados por el docente (usalos como fuente principal, y citá de qué documento sale cada cosa en \`fuente.nota\`):\n---\n${textoDocumentos.slice(0, 12000)}\n---`;
}

export async function generarObjetivosContenidos(
  plan: ContextoPlan,
  textoDocumentos: string
): Promise<ObjetivosContenidos> {
  const raw = await callClaude({
    messages: [
      {
        role: "user",
        content: `Generá una propuesta de objetivos y contenidos para una planificación de clase.

${contextoBase(plan)}

Lo que pide el docente, en sus palabras:
"""
${plan.contextoLibre ?? "(sin detalle adicional)"}
"""

${documentosBloque(textoDocumentos)}

Devolvé SOLO este JSON (sin markdown, sin texto extra):
{
  "objetivoGeneral": { "texto": string, "estado": "sugerencia" },
  "objetivosEspecificos": [ { "id": "s0", "texto": string, "estado": "sugerencia" }, ... (2 a 4 items) ],
  "unidadesContenido": [
    { "id": "u0", "titulo": string, "tag": "Conceptual"|"Procedimental"|"Actitudinal", "subtemas": [ { "id": "u0-0", "texto": string } ] }
    ... (2 a 4 unidades)
  ],
  "fuente": { "basadoEnDocumentos": boolean, "nota": string },
  "chat": []
}`,
      },
    ],
  });
  return parseClaudeJson<ObjetivosContenidos>(raw);
}

export async function ajustarObjetivosContenidos(
  actual: ObjetivosContenidos,
  mensaje: string
): Promise<ObjetivosContenidos> {
  const raw = await callClaude({
    messages: [
      {
        role: "user",
        content: `Este es el JSON actual de objetivos y contenidos de una planificación:
${JSON.stringify(actual)}

El docente pide este ajuste: "${mensaje}"

Aplicá el ajuste y devolvé el JSON completo actualizado con la MISMA forma (objetivoGeneral, objetivosEspecificos, unidadesContenido, fuente, chat). Marcá "estado": "editado" en las partes que cambiaste. Agregá al array "chat" los dos mensajes nuevos: { "from": "user", "texto": "${mensaje.replace(/"/g, '\\"')}" } y un { "from": "aulera", "texto": "<resumen breve y concreto de qué cambiaste>" }. Devolvé SOLO el JSON.`,
      },
    ],
  });
  return parseClaudeJson<ObjetivosContenidos>(raw);
}

export async function generarMetodologiaActividades(
  plan: ContextoPlan,
  objetivosContenidos: ObjetivosContenidos,
  recursosDisponibles: string[]
): Promise<MetodologiaActividades> {
  const raw = await callClaude({
    messages: [
      {
        role: "user",
        content: `Generá una propuesta de metodología y actividades (inicio, desarrollo, cierre) para esta planificación.

${contextoBase(plan)}

Objetivos y contenidos ya aprobados por el docente:
${JSON.stringify(objetivosContenidos)}

Recursos disponibles en el aula: ${recursosDisponibles.length ? recursosDisponibles.join(", ") : "no especificados"}.

Devolvé SOLO este JSON:
{
  "recursosDisponibles": ${JSON.stringify(recursosDisponibles)},
  "metodologia": { "texto": string, "motivo": string, "estado": "sugerencia" },
  "actividades": {
    "inicio": { "titulo": "Inicio", "tipo": string, "objetivo": string, "duracion": string, "consigna": string, "modalidad": string, "recursos": string, "resultadoEsperado": string },
    "desarrollo": { "titulo": "Desarrollo", "tipo": string, "objetivo": string, "duracion": string, "consigna": string, "modalidad": string, "recursos": string, "resultadoEsperado": string },
    "cierre": { "titulo": "Cierre", "tipo": string, "objetivo": string, "duracion": string, "consigna": string, "modalidad": string, "recursos": string, "resultadoEsperado": string }
  },
  "chat": []
}`,
      },
    ],
  });
  return parseClaudeJson<MetodologiaActividades>(raw);
}

export async function ajustarMetodologiaActividades(
  actual: MetodologiaActividades,
  mensaje: string
): Promise<MetodologiaActividades> {
  const raw = await callClaude({
    messages: [
      {
        role: "user",
        content: `Este es el JSON actual de metodología y actividades:
${JSON.stringify(actual)}

El docente pide este ajuste: "${mensaje}"

Aplicá el ajuste y devolvé el JSON completo actualizado con la MISMA forma. Agregá al array "chat" los dos mensajes nuevos (user y aulera, este último con un resumen breve de qué cambiaste). Devolvé SOLO el JSON.`,
      },
    ],
  });
  return parseClaudeJson<MetodologiaActividades>(raw);
}

export async function generarInstrumentoEvaluacion(
  plan: ContextoPlan,
  objetivosContenidos: ObjetivosContenidos,
  metodologiaActividades: MetodologiaActividades,
  tiposEvaluacion: string[]
): Promise<InstrumentoEvaluacion> {
  const raw = await callClaude({
    messages: [
      {
        role: "user",
        content: `Generá una propuesta de instrumento de evaluación para esta planificación.

${contextoBase(plan)}

Objetivos y contenidos:
${JSON.stringify(objetivosContenidos)}

Metodología y actividades:
${JSON.stringify(metodologiaActividades)}

Tipos de evaluación seleccionados por el docente: ${tiposEvaluacion.length ? tiposEvaluacion.join(", ") : "no especificados"}.

Devolvé SOLO este JSON:
{
  "tiposEvaluacion": ${JSON.stringify(tiposEvaluacion)},
  "instrumento": { "texto": string, "motivo": string, "estado": "sugerencia" },
  "criterios": [string, string, string],
  "chat": []
}`,
      },
    ],
  });
  return parseClaudeJson<InstrumentoEvaluacion>(raw);
}

export async function ajustarInstrumentoEvaluacion(
  actual: InstrumentoEvaluacion,
  mensaje: string
): Promise<InstrumentoEvaluacion> {
  const raw = await callClaude({
    messages: [
      {
        role: "user",
        content: `Este es el JSON actual del instrumento de evaluación:
${JSON.stringify(actual)}

El docente pide este ajuste: "${mensaje}"

Aplicá el ajuste y devolvé el JSON completo actualizado con la MISMA forma. Agregá al array "chat" los dos mensajes nuevos (user y aulera). Devolvé SOLO el JSON.`,
      },
    ],
  });
  return parseClaudeJson<InstrumentoEvaluacion>(raw);
}

export async function verificarCoherencia(
  objetivosContenidos: ObjetivosContenidos,
  metodologiaActividades: MetodologiaActividades,
  instrumentoEvaluacion: InstrumentoEvaluacion
): Promise<CoherenciaReporte> {
  const raw = await callClaude({
    messages: [
      {
        role: "user",
        content: `Analizá la coherencia pedagógica entre estos tres bloques de una planificación de clase:

CONTENIDOS Y OBJETIVOS:
${JSON.stringify(objetivosContenidos)}

METODOLOGÍA Y ACTIVIDADES:
${JSON.stringify(metodologiaActividades)}

INSTRUMENTO DE EVALUACIÓN:
${JSON.stringify(instrumentoEvaluacion)}

Compará: (1) si los contenidos definidos están cubiertos por las actividades, (2) si los objetivos son alcanzables con las actividades propuestas, (3) si las actividades producen evidencias observables, (4) si esas evidencias son las que efectivamente evalúa el instrumento elegido, (5) si el instrumento de evaluación es coherente con el resto.

Devolvé SOLO este JSON:
{
  "cadena": [
    { "clave": "contenidos", "label": "Contenidos", "estado": "ok"|"warning", "detalle": string },
    { "clave": "objetivos", "label": "Objetivos", "estado": "ok"|"warning", "detalle": string },
    { "clave": "actividades", "label": "Actividades", "estado": "ok"|"warning", "detalle": string },
    { "clave": "evidencias", "label": "Evidencias", "estado": "ok"|"warning", "detalle": string },
    { "clave": "evaluacion", "label": "Evaluación", "estado": "ok"|"warning", "detalle": string }
  ],
  "advertencias": [ { "titulo": string, "descripcion": string } ],
  "generadoEn": "${new Date().toISOString()}"
}
Si todo está coherente, "advertencias" puede ser un array vacío.`,
      },
    ],
  });
  return parseClaudeJson<CoherenciaReporte>(raw);
}

export async function chatAsistente(params: {
  contextoPaso: string;
  historial: { from: "user" | "aulera"; texto: string }[];
  mensaje: string;
}): Promise<string> {
  const historialTexto = params.historial
    .map((m) => `${m.from === "user" ? "Docente" : "Aulera"}: ${m.texto}`)
    .join("\n");
  return callClaude({
    messages: [
      {
        role: "user",
        content: `Sos el asistente lateral de Aulera para este paso de la planificación.

Contenido actual del paso:
${params.contextoPaso}

Conversación previa:
${historialTexto || "(sin mensajes previos)"}

Nuevo mensaje del docente: "${params.mensaje}"

Respondé en 1 a 3 oraciones, en español rioplatense, explicando qué le sugerís o aclarando su duda. No devuelvas JSON, solo texto plano.`,
      },
    ],
    maxTokens: 400,
  });
}
