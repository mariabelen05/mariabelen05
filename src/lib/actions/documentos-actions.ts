"use server";

import path from "node:path";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { extraerTexto } from "@/lib/document-extraction";
import { revalidatePath } from "next/cache";

// Statically scoped (not built from env) so Next's file tracing doesn't
// bundle the whole project — see the Turbopack warning this used to trigger.
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const TIPOS_SOPORTADOS = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

export async function subirDocumento(formData: FormData) {
  const docente = await requireDocente();
  const file = formData.get("archivo");
  const clasificacion = String(formData.get("clasificacion") || "") || null;
  const planificacionId = String(formData.get("planificacionId") || "") || null;

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seleccioná un archivo para subir.");
  }
  if (!TIPOS_SOPORTADOS.has(file.type)) {
    throw new Error(`Tipo de archivo no soportado: ${file.type || "desconocido"}`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dirDocente = path.join(UPLOADS_DIR, docente.id);
  await mkdir(dirDocente, { recursive: true });
  const storageName = `${randomUUID()}-${file.name}`;
  const storagePath = path.join(dirDocente, storageName);
  await writeFile(storagePath, bytes);

  const doc = await prisma.documento.create({
    data: {
      docenteId: docente.id,
      planificacionId,
      nombreArchivo: file.name,
      mimeType: file.type,
      storagePath,
      clasificacion,
      estado: "PROCESANDO",
    },
  });

  // Extraction runs inline (no background job queue in v1) — the request
  // waits for it, so the UI shows PROCESADO/ERROR as soon as the upload returns.
  const resultado = await extraerTexto(bytes, file.type);
  if ("error" in resultado) {
    await prisma.documento.update({
      where: { id: doc.id },
      data: { estado: "ERROR", errorMensaje: resultado.error },
    });
  } else {
    await prisma.documento.update({
      where: { id: doc.id },
      data: { estado: "PROCESADO", textoExtraido: resultado.texto },
    });
  }

  revalidatePath("/documentos");
  if (planificacionId) revalidatePath(`/planificaciones/${planificacionId}/paso-1`);
}

export async function eliminarDocumento(documentoId: string) {
  const docente = await requireDocente();
  const doc = await prisma.documento.findUnique({ where: { id: documentoId } });
  if (!doc || doc.docenteId !== docente.id) throw new Error("No encontrado.");
  await prisma.documento.delete({ where: { id: documentoId } });
  await unlink(doc.storagePath).catch(() => {});
  revalidatePath("/documentos");
}

export async function reprocesarDocumento(documentoId: string) {
  const docente = await requireDocente();
  const doc = await prisma.documento.findUnique({ where: { id: documentoId } });
  if (!doc || doc.docenteId !== docente.id) throw new Error("No encontrado.");

  await prisma.documento.update({ where: { id: documentoId }, data: { estado: "PROCESANDO", errorMensaje: null } });

  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(doc.storagePath);
  const resultado = await extraerTexto(bytes, doc.mimeType);

  if ("error" in resultado) {
    await prisma.documento.update({ where: { id: documentoId }, data: { estado: "ERROR", errorMensaje: resultado.error } });
  } else {
    await prisma.documento.update({ where: { id: documentoId }, data: { estado: "PROCESADO", textoExtraido: resultado.texto, errorMensaje: null } });
  }
  revalidatePath("/documentos");
}
