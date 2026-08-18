"use server";

import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  generarObjetivosContenidos, ajustarObjetivosContenidos,
  generarMetodologiaActividades, ajustarMetodologiaActividades,
  generarInstrumentoEvaluacion, ajustarInstrumentoEvaluacion,
  verificarCoherencia, chatAsistente,
} from "@/lib/planificacion-ai";
import type {
  ObjetivosContenidos, MetodologiaActividades, InstrumentoEvaluacion,
} from "@/lib/planificacion-types";

// ---------- access control ----------

export async function getPlanConAcceso(planId: string) {
  const docente = await requireDocente();
  const plan = await prisma.planificacion.findUnique({
    where: { id: planId },
    include: { colaboradores: true, documentos: true },
  });
  if (!plan) redirect("/planificaciones");

  const esCreador = plan.docenteId === docente.id;
  const colaboracion = plan.colaboradores.find(
    (c) => c.docenteId === docente.id || c.email.toLowerCase() === docente.email.toLowerCase()
  );
  if (!esCreador && !colaboracion) redirect("/planificaciones");

  const rol: "OWNER" | "EDITOR" | "VISOR" = esCreador
    ? "OWNER"
    : colaboracion!.rol === "EDITOR"
    ? "EDITOR"
    : "VISOR";

  return { docente, plan, rol };
}

async function requireEdicion(planId: string) {
  const { docente, plan, rol } = await getPlanConAcceso(planId);
  if (rol === "VISOR") throw new Error("No tenés permiso de edición sobre esta planificación.");
  return { docente, plan };
}

async function textoDocumentosDePlan(planId: string) {
  const docs = await prisma.documento.findMany({
    where: { planificacionId: planId, estado: "PROCESADO" },
  });
  return docs.map((d) => `[${d.nombreArchivo}]\n${d.textoExtraido ?? ""}`).join("\n\n---\n\n");
}

async function registrarActividad(planificacionId: string, docenteId: string, paso: string, accion: string) {
  await prisma.planActivity.create({ data: { planificacionId, docenteId, paso, accion } });
}

// ---------- creación ----------

export async function crearPlanificacion(formData: FormData) {
  const docente = await requireDocente();

  const titulo = String(formData.get("titulo") || "").trim() || "Nueva planificación";
  const materia = String(formData.get("materia") || "").trim() || null;
  const curso = String(formData.get("curso") || "").trim() || null;
  const contextoLibre = String(formData.get("contextoLibre") || "").trim() || null;

  const plan = await prisma.planificacion.create({
    data: {
      titulo,
      docenteId: docente.id,
      materia,
      curso,
      provincia: docente.provincia,
      modalidad: docente.modalidad,
      contextoLibre,
      estado: "EN_PROGRESO",
    },
  });

  await registrarActividad(plan.id, docente.id, "general", "creo_planificacion");
  redirect(`/planificaciones/${plan.id}/paso-1`);
}

// ---------- Paso 1: Objetivos y Contenidos ----------

export async function generarPaso1(planId: string) {
  const { docente, plan } = await requireEdicion(planId);
  const textoDocs = await textoDocumentosDePlan(planId);
  const contenido = await generarObjetivosContenidos(plan, textoDocs);

  await prisma.planificacion.update({
    where: { id: planId },
    data: { objetivosContenidos: JSON.stringify(contenido), paso1Estado: "EN_PROGRESO" },
  });
  await registrarActividad(planId, docente.id, "paso1", "genero_ia");
  revalidatePath(`/planificaciones/${planId}/paso-1`);
}

export async function ajustarPaso1(planId: string, mensaje: string) {
  const { docente, plan } = await requireEdicion(planId);
  if (!plan.objetivosContenidos) throw new Error("Generá primero una propuesta.");
  const actual = JSON.parse(plan.objetivosContenidos) as ObjetivosContenidos;
  const actualizado = await ajustarObjetivosContenidos(actual, mensaje);

  await prisma.planificacion.update({
    where: { id: planId },
    data: { objetivosContenidos: JSON.stringify(actualizado) },
  });
  await registrarActividad(planId, docente.id, "paso1", "ajusto_via_chat");
  revalidatePath(`/planificaciones/${planId}/paso-1`);
  return actualizado;
}

export async function guardarPaso1(planId: string, contenido: ObjetivosContenidos, aprobar: boolean) {
  const { docente } = await requireEdicion(planId);
  await prisma.planificacion.update({
    where: { id: planId },
    data: {
      objetivosContenidos: JSON.stringify(contenido),
      paso1Estado: aprobar ? "COMPLETADO" : "EN_PROGRESO",
      version: { increment: 1 },
    },
  });
  await registrarActividad(planId, docente.id, "paso1", aprobar ? "aprobo_paso" : "edito");
  revalidatePath(`/planificaciones/${planId}/paso-1`);
  if (aprobar) redirect(`/planificaciones/${planId}/paso-2`);
}

// ---------- Paso 2: Metodología y Actividades ----------

export async function generarPaso2(planId: string, recursosDisponibles: string[]) {
  const { docente, plan } = await requireEdicion(planId);
  if (!plan.objetivosContenidos) throw new Error("Completá el paso 1 primero.");
  const objetivos = JSON.parse(plan.objetivosContenidos) as ObjetivosContenidos;
  const contenido = await generarMetodologiaActividades(plan, objetivos, recursosDisponibles);

  await prisma.planificacion.update({
    where: { id: planId },
    data: { metodologiaActividades: JSON.stringify(contenido), paso2Estado: "EN_PROGRESO" },
  });
  await registrarActividad(planId, docente.id, "paso2", "genero_ia");
  revalidatePath(`/planificaciones/${planId}/paso-2`);
}

export async function ajustarPaso2(planId: string, mensaje: string) {
  const { docente, plan } = await requireEdicion(planId);
  if (!plan.metodologiaActividades) throw new Error("Generá primero una propuesta.");
  const actual = JSON.parse(plan.metodologiaActividades) as MetodologiaActividades;
  const actualizado = await ajustarMetodologiaActividades(actual, mensaje);

  await prisma.planificacion.update({
    where: { id: planId },
    data: { metodologiaActividades: JSON.stringify(actualizado) },
  });
  await registrarActividad(planId, docente.id, "paso2", "ajusto_via_chat");
  revalidatePath(`/planificaciones/${planId}/paso-2`);
  return actualizado;
}

export async function guardarPaso2(planId: string, contenido: MetodologiaActividades, aprobar: boolean) {
  const { docente } = await requireEdicion(planId);
  await prisma.planificacion.update({
    where: { id: planId },
    data: {
      metodologiaActividades: JSON.stringify(contenido),
      paso2Estado: aprobar ? "COMPLETADO" : "EN_PROGRESO",
      version: { increment: 1 },
    },
  });
  await registrarActividad(planId, docente.id, "paso2", aprobar ? "aprobo_paso" : "edito");
  revalidatePath(`/planificaciones/${planId}/paso-2`);
  if (aprobar) redirect(`/planificaciones/${planId}/paso-3`);
}

// ---------- Paso 3: Evaluación y Coherencia ----------

export async function generarPaso3(planId: string, tiposEvaluacion: string[]) {
  const { docente, plan } = await requireEdicion(planId);
  if (!plan.objetivosContenidos || !plan.metodologiaActividades) {
    throw new Error("Completá los pasos 1 y 2 primero.");
  }
  const objetivos = JSON.parse(plan.objetivosContenidos) as ObjetivosContenidos;
  const metodologia = JSON.parse(plan.metodologiaActividades) as MetodologiaActividades;
  const contenido = await generarInstrumentoEvaluacion(plan, objetivos, metodologia, tiposEvaluacion);

  await prisma.planificacion.update({
    where: { id: planId },
    data: { instrumentoEvaluacion: JSON.stringify(contenido), paso3Estado: "EN_PROGRESO" },
  });
  await registrarActividad(planId, docente.id, "paso3", "genero_ia");
  revalidatePath(`/planificaciones/${planId}/paso-3`);
}

export async function ajustarPaso3(planId: string, mensaje: string) {
  const { docente, plan } = await requireEdicion(planId);
  if (!plan.instrumentoEvaluacion) throw new Error("Generá primero una propuesta.");
  const actual = JSON.parse(plan.instrumentoEvaluacion) as InstrumentoEvaluacion;
  const actualizado = await ajustarInstrumentoEvaluacion(actual, mensaje);

  await prisma.planificacion.update({
    where: { id: planId },
    data: { instrumentoEvaluacion: JSON.stringify(actualizado) },
  });
  await registrarActividad(planId, docente.id, "paso3", "ajusto_via_chat");
  revalidatePath(`/planificaciones/${planId}/paso-3`);
  return actualizado;
}

export async function verificarCoherenciaAction(planId: string) {
  const { docente, plan } = await requireEdicion(planId);
  if (!plan.objetivosContenidos || !plan.metodologiaActividades || !plan.instrumentoEvaluacion) {
    throw new Error("Completá objetivos, metodología e instrumento de evaluación primero.");
  }
  const reporte = await verificarCoherencia(
    JSON.parse(plan.objetivosContenidos),
    JSON.parse(plan.metodologiaActividades),
    JSON.parse(plan.instrumentoEvaluacion)
  );
  await prisma.planificacion.update({
    where: { id: planId },
    data: { coherenciaReporte: JSON.stringify(reporte) },
  });
  await registrarActividad(planId, docente.id, "paso3", "verifico_coherencia");
  revalidatePath(`/planificaciones/${planId}/paso-3`);
}

export async function guardarPaso3(planId: string, contenido: InstrumentoEvaluacion, aprobar: boolean) {
  const { docente } = await requireEdicion(planId);
  await prisma.planificacion.update({
    where: { id: planId },
    data: {
      instrumentoEvaluacion: JSON.stringify(contenido),
      paso3Estado: aprobar ? "COMPLETADO" : "EN_PROGRESO",
      version: { increment: 1 },
    },
  });
  await registrarActividad(planId, docente.id, "paso3", aprobar ? "aprobo_paso" : "edito");
  revalidatePath(`/planificaciones/${planId}/paso-3`);
  if (aprobar) redirect(`/planificaciones/${planId}/paso-4`);
}

// ---------- Paso 4: Resultado final ----------

export async function finalizarPlanificacion(planId: string) {
  const { docente, plan } = await requireEdicion(planId);
  if (plan.paso1Estado !== "COMPLETADO" || plan.paso2Estado !== "COMPLETADO" || plan.paso3Estado !== "COMPLETADO") {
    throw new Error("Completá y aprobá los 3 pasos anteriores antes de finalizar.");
  }
  await prisma.planificacion.update({
    where: { id: planId },
    data: {
      paso4Estado: "COMPLETADO",
      estado: "FINALIZADA",
      resultadoFinal: JSON.stringify({ resumen: plan.titulo, aprobadoEn: new Date().toISOString() }),
    },
  });
  await registrarActividad(planId, docente.id, "paso4", "finalizo_planificacion");
  revalidatePath(`/planificaciones/${planId}/paso-4`);
  revalidatePath("/planificaciones");
}

// ---------- Chat asistente (todas los pasos) ----------

export async function enviarMensajeAsistente(planId: string, paso: string, mensaje: string) {
  const { plan } = await getPlanConAcceso(planId);
  const contenidoPorPaso: Record<string, string | null> = {
    paso1: plan.objetivosContenidos,
    paso2: plan.metodologiaActividades,
    paso3: plan.instrumentoEvaluacion,
  };
  const raw = contenidoPorPaso[paso];
  const contextoPaso = raw ?? "(el docente todavía no generó una propuesta para este paso)";
  const historial = raw ? (JSON.parse(raw).chat ?? []) : [];

  const respuesta = await chatAsistente({ contextoPaso, historial, mensaje });
  return respuesta;
}

export async function eliminarPlanificacion(planId: string) {
  const { docente, plan } = await getPlanConAcceso(planId);
  if (plan.docenteId !== docente.id) throw new Error("Solo quien creó la planificación puede eliminarla.");
  await prisma.planificacion.delete({ where: { id: planId } });
  revalidatePath("/planificaciones");
  redirect("/planificaciones");
}
