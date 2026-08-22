"use server";

import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { textoDocumentosDePlan } from "@/lib/actions/planificacion-actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generarContenidoEvaluacion, ajustarContenidoEvaluacion } from "@/lib/evaluacion-ai";
import type { EvaluacionContenido } from "@/lib/evaluacion-types";
import type { ObjetivosContenidos, MetodologiaActividades } from "@/lib/planificacion-types";

export async function crearEvaluacion(formData: FormData) {
  const docente = await requireDocente();
  const titulo = String(formData.get("titulo") || "").trim();
  const tipo = String(formData.get("tipo") || "") || null;
  const planificacionId = String(formData.get("planificacionId") || "") || null;
  if (!titulo) throw new Error("Ingresá un título.");

  const evaluacion = await prisma.evaluacion.create({ data: { docenteId: docente.id, titulo, tipo, planificacionId } });
  revalidatePath("/evaluaciones");
  redirect(`/evaluaciones/${evaluacion.id}`);
}

export async function eliminarEvaluacion(evaluacionId: string) {
  const docente = await requireDocente();
  const ev = await prisma.evaluacion.findUnique({ where: { id: evaluacionId } });
  if (!ev || ev.docenteId !== docente.id) throw new Error("No encontrada.");
  await prisma.evaluacion.delete({ where: { id: evaluacionId } });
  revalidatePath("/evaluaciones");
}

export async function getEvaluacionConAcceso(evaluacionId: string) {
  const docente = await requireDocente();
  const evaluacion = await prisma.evaluacion.findUnique({ where: { id: evaluacionId } });
  if (!evaluacion || evaluacion.docenteId !== docente.id) redirect("/evaluaciones");
  return { docente, evaluacion };
}

// Builds a short, human-readable summary of the linked planificación's
// already-approved content (not the raw JSON) so the AI draft is grounded in
// what was actually taught, without dumping the whole structured shape.
async function contextoPlanificacionDeEvaluacion(planificacionId: string | null): Promise<string> {
  if (!planificacionId) return "";
  const plan = await prisma.planificacion.findUnique({ where: { id: planificacionId } });
  if (!plan) return "";

  const partes: string[] = [];
  if (plan.materia) partes.push(`Materia: ${plan.materia}`);
  if (plan.curso) partes.push(`Curso/año: ${plan.curso}`);

  if (plan.objetivosContenidos) {
    try {
      const oc = JSON.parse(plan.objetivosContenidos) as ObjetivosContenidos;
      partes.push(`Objetivo general: ${oc.objetivoGeneral.texto}`);
      partes.push(`Unidades de contenido: ${oc.unidadesContenido.map((u) => u.titulo).join(", ")}`);
    } catch {
      // JSON malformado o de una versión anterior — se ignora, no bloquea la generación.
    }
  }

  if (plan.metodologiaActividades) {
    try {
      const ma = JSON.parse(plan.metodologiaActividades) as MetodologiaActividades;
      partes.push(`Metodología: ${ma.metodologia.texto}`);
    } catch {
      // Idem.
    }
  }

  return partes.join("\n");
}

export async function generarContenidoEvaluacionAction(evaluacionId: string) {
  const { evaluacion } = await getEvaluacionConAcceso(evaluacionId);
  const [contextoPlanificacion, textoDocumentos] = await Promise.all([
    contextoPlanificacionDeEvaluacion(evaluacion.planificacionId),
    evaluacion.planificacionId ? textoDocumentosDePlan(evaluacion.planificacionId) : Promise.resolve(""),
  ]);

  const contenido = await generarContenidoEvaluacion({
    titulo: evaluacion.titulo,
    tipo: evaluacion.tipo,
    contextoPlanificacion,
    textoDocumentos,
  });

  await prisma.evaluacion.update({ where: { id: evaluacionId }, data: { contenido: JSON.stringify(contenido) } });
  revalidatePath(`/evaluaciones/${evaluacionId}`);
}

// Operates on the teacher's current draft from the client (not what's saved in
// the DB) so asking the assistant for a tweak never discards free-typed text
// that hasn't been saved yet.
export async function ajustarContenidoEvaluacionAction(
  evaluacionId: string,
  contenidoActual: EvaluacionContenido,
  mensaje: string
) {
  await getEvaluacionConAcceso(evaluacionId);
  const actualizado = await ajustarContenidoEvaluacion(contenidoActual, mensaje);
  await prisma.evaluacion.update({ where: { id: evaluacionId }, data: { contenido: JSON.stringify(actualizado) } });
  revalidatePath(`/evaluaciones/${evaluacionId}`);
  return actualizado;
}

export async function guardarContenidoEvaluacionAction(
  evaluacionId: string,
  contenido: EvaluacionContenido,
  aprobar: boolean
) {
  await getEvaluacionConAcceso(evaluacionId);
  const final: EvaluacionContenido = aprobar ? { ...contenido, estado: "aprobado" } : contenido;
  await prisma.evaluacion.update({ where: { id: evaluacionId }, data: { contenido: JSON.stringify(final) } });
  revalidatePath(`/evaluaciones/${evaluacionId}`);
}
