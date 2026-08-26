"use server";

import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { extraerTexto } from "@/lib/document-extraction";
import { revalidatePath } from "next/cache";
import { buildStorageKey, uploadFile, downloadFile, deleteFile } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";

const TIPOS_SOPORTADOS = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

// The form submits either a real File in `archivo` (uploaded through this
// Server Action, capped at MAX_UPLOAD_BYTES) or — when the browser already
// uploaded it directly to Supabase Storage, see subirArchivoDirecto —
// `archivoStoragePath`/`archivoNombre`/`archivoMimeType` referencing the
// object it just wrote there, capped at the much higher MAX_DIRECT_UPLOAD_BYTES
// (enforced in iniciarSubidaDirecta, before the browser ever uploads).
// Returns { error } instead of throwing for expected validation failures —
// Next.js redacts thrown Server Action errors to a generic digest in
// production builds, so a caught, user-facing message must be a return
// value, not a thrown Error. See https://nextjs.org/docs error-handling guide.
export async function subirDocumento(formData: FormData): Promise<{ error: string } | undefined> {
  const docente = await requireDocente();
  const clasificacion = String(formData.get("clasificacion") || "") || null;
  const planificacionId = String(formData.get("planificacionId") || "") || null;

  const file = formData.get("archivo");
  let storagePath: string;
  let nombreArchivo: string;
  let mimeType: string;
  let bytes: Buffer;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: `El archivo pesa demasiado. El tamaño máximo permitido es ${MAX_UPLOAD_LABEL}.` };
    }
    if (!TIPOS_SOPORTADOS.has(file.type)) {
      return { error: `Tipo de archivo no soportado: ${file.type || "desconocido"}` };
    }
    nombreArchivo = file.name;
    mimeType = file.type;
    bytes = Buffer.from(await file.arrayBuffer());
    storagePath = buildStorageKey(docente.id, nombreArchivo);
    await uploadFile(storagePath, bytes, mimeType || undefined);
  } else {
    const storagePathDirecto = String(formData.get("archivoStoragePath") || "");
    if (!storagePathDirecto) return { error: "Seleccioná un archivo para subir." };
    // Direct-upload paths are always ones we minted for this docente in
    // iniciarSubidaDirecta — reject anything else rather than trust a
    // client-supplied path blindly.
    if (!storagePathDirecto.startsWith(`${docente.id}/`)) return { error: "Ruta de archivo inválida." };
    mimeType = String(formData.get("archivoMimeType") || "");
    if (!TIPOS_SOPORTADOS.has(mimeType)) {
      return { error: `Tipo de archivo no soportado: ${mimeType || "desconocido"}` };
    }
    nombreArchivo = String(formData.get("archivoNombre") || "archivo");
    storagePath = storagePathDirecto;
    bytes = await downloadFile(storagePath);
  }

  const doc = await prisma.documento.create({
    data: {
      docenteId: docente.id,
      planificacionId,
      nombreArchivo,
      mimeType,
      storagePath,
      tamano: bytes.length,
      clasificacion,
      estado: "PROCESANDO",
    },
  });

  // Extraction runs inline (no background job queue in v1) — the request
  // waits for it, so the UI shows PROCESADO/ERROR as soon as the upload returns.
  const resultado = await extraerTexto(bytes, mimeType);
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
  await deleteFile(doc.storagePath).catch(() => {});
  revalidatePath("/documentos");
}

export async function reprocesarDocumento(documentoId: string) {
  const docente = await requireDocente();
  const doc = await prisma.documento.findUnique({ where: { id: documentoId } });
  if (!doc || doc.docenteId !== docente.id) throw new Error("No encontrado.");

  await prisma.documento.update({ where: { id: documentoId }, data: { estado: "PROCESANDO", errorMensaje: null } });

  const bytes = await downloadFile(doc.storagePath);
  const resultado = await extraerTexto(bytes, doc.mimeType);

  if ("error" in resultado) {
    await prisma.documento.update({ where: { id: documentoId }, data: { estado: "ERROR", errorMensaje: resultado.error } });
  } else {
    await prisma.documento.update({ where: { id: documentoId }, data: { estado: "PROCESADO", textoExtraido: resultado.texto, errorMensaje: null } });
  }
  revalidatePath("/documentos");
}
