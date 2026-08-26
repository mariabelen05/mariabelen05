"use server";

import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { textoDocumentosDePlan } from "@/lib/actions/planificacion-actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generarContenidoEvaluacion, ajustarContenidoEvaluacion } from "@/lib/evaluacion-ai";
import { buildStorageKey, uploadFile, deleteFile } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";
import { extraerIdsImagenes } from "@/lib/evaluacion-canvas";
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

// Deletes any EvaluacionImagen row (and its storage file) no longer
// referenced by the saved texto — e.g. the docente removed the image from
// the canvas, or an AI regenerate/ajuste replaced the whole document.
async function limpiarImagenesHuerfanas(evaluacionId: string, texto: string) {
  const idsReferenciados = new Set(extraerIdsImagenes(texto));
  const imagenes = await prisma.evaluacionImagen.findMany({ where: { evaluacionId } });
  const huerfanas = imagenes.filter((img) => !idsReferenciados.has(img.id));
  if (!huerfanas.length) return;

  await prisma.evaluacionImagen.deleteMany({ where: { id: { in: huerfanas.map((h) => h.id) } } });
  await Promise.all(huerfanas.map((h) => deleteFile(h.storagePath).catch(() => {})));
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
  await limpiarImagenesHuerfanas(evaluacionId, contenido.texto);
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
  await limpiarImagenesHuerfanas(evaluacionId, actualizado.texto);
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
  await limpiarImagenesHuerfanas(evaluacionId, final.texto);
  revalidatePath(`/evaluaciones/${evaluacionId}`);
}

const TIPOS_IMAGEN_SOPORTADOS = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

// Uploads an image inserted into the canvas. Always re-encoded to PNG via
// sharp regardless of the source format, so both exporters (pdfkit, docx)
// only ever have to handle one image type.
// Returns { error } instead of throwing for expected validation failures —
// Next.js redacts thrown Server Action errors to a generic digest in
// production builds, so a caught, user-facing message must be a return
// value, not a thrown Error. See https://nextjs.org/docs error-handling guide.
export async function subirImagenEvaluacion(
  evaluacionId: string,
  formData: FormData
): Promise<{ id: string; width: number; height: number } | { error: string }> {
  const { docente } = await getEvaluacionConAcceso(evaluacionId);
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Seleccioná una imagen para insertar." };
  }
  if (!TIPOS_IMAGEN_SOPORTADOS.has(archivo.type)) {
    return { error: `Formato de imagen no soportado: ${archivo.type || "desconocido"}` };
  }
  if (archivo.size > MAX_UPLOAD_BYTES) {
    return { error: `La imagen pesa demasiado. El tamaño máximo permitido es ${MAX_UPLOAD_LABEL}.` };
  }

  const original = Buffer.from(await archivo.arrayBuffer());
  const png = sharp(original).png();
  const { width, height } = await png.metadata();
  if (!width || !height) return { error: "No se pudo procesar la imagen." };
  const bytes = await png.toBuffer();

  const storagePath = buildStorageKey(docente.id, `imagen-${Date.now()}.png`, "evaluaciones");
  await uploadFile(storagePath, bytes, "image/png");

  const imagen = await prisma.evaluacionImagen.create({
    data: { evaluacionId, storagePath, width, height, tamano: bytes.length },
  });
  return { id: imagen.id, width, height };
}
