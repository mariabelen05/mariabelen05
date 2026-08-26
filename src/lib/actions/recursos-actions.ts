"use server";

import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { revalidatePath } from "next/cache";
import { RECURSO_COLOR_ORDER } from "@/lib/recurso-colors";
import { buildStorageKey, uploadFile, deleteFile } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";

// The form submits either a real File in `archivo` (uploaded through this
// Server Action, capped at MAX_UPLOAD_BYTES) or — when the browser already
// uploaded it directly to Supabase Storage, see subirArchivoDirecto —
// `archivoStoragePath`/`archivoMimeType` referencing the object it just
// wrote there, capped at the much higher MAX_DIRECT_UPLOAD_BYTES (enforced
// in iniciarSubidaDirecta, before the browser ever uploads).
// Returns { error } instead of throwing for expected validation failures —
// Next.js redacts thrown Server Action errors to a generic digest in
// production builds, so a caught, user-facing message must be a return
// value, not a thrown Error. See https://nextjs.org/docs error-handling guide.
export async function crearRecurso(formData: FormData): Promise<{ error: string } | undefined> {
  const docente = await requireDocente();
  const titulo = String(formData.get("titulo") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const planificacionId = String(formData.get("planificacionId") || "") || null;
  const url = String(formData.get("url") || "").trim() || null;
  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw ? JSON.stringify(tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)) : null;
  const archivo = formData.get("archivo");

  if (!titulo) return { error: "Ingresá un título." };

  let storagePath: string | null = null;
  let mimeType: string | null = null;
  let tamano: number | null = null;
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > MAX_UPLOAD_BYTES) {
      return { error: `El archivo pesa demasiado. El tamaño máximo permitido es ${MAX_UPLOAD_LABEL}.` };
    }
    storagePath = buildStorageKey(docente.id, archivo.name, "recursos");
    await uploadFile(storagePath, Buffer.from(await archivo.arrayBuffer()), archivo.type || undefined);
    mimeType = archivo.type || null;
    tamano = archivo.size;
  } else {
    const storagePathDirecto = String(formData.get("archivoStoragePath") || "");
    if (storagePathDirecto) {
      // Direct-upload paths are always ones we minted for this docente in
      // iniciarSubidaDirecta — reject anything else rather than trust a
      // client-supplied path blindly.
      if (!storagePathDirecto.startsWith(`${docente.id}/`)) return { error: "Ruta de archivo inválida." };
      storagePath = storagePathDirecto;
      mimeType = String(formData.get("archivoMimeType") || "") || null;
      // Sent by the client (subirArchivoDirecto already knows the file's
      // size before upload) — the server never sees the bytes on this path.
      tamano = Number(formData.get("archivoTamano")) || null;
    }
  }

  if (!storagePath && !url) return { error: "Subí un archivo o pegá un enlace." };

  await prisma.recurso.create({
    data: {
      docenteId: docente.id,
      titulo,
      descripcion,
      planificacionId,
      tags,
      tipo: storagePath ? "archivo" : "enlace",
      url,
      storagePath,
      mimeType,
      tamano,
    },
  });
  revalidatePath("/recursos");
}

export async function cambiarColorRecurso(recursoId: string, colorId: string | null) {
  if (colorId !== null && !RECURSO_COLOR_ORDER.includes(colorId as (typeof RECURSO_COLOR_ORDER)[number])) {
    throw new Error("Color inválido.");
  }
  const docente = await requireDocente();
  const r = await prisma.recurso.findUnique({ where: { id: recursoId } });
  if (!r || r.docenteId !== docente.id) throw new Error("No encontrado.");
  await prisma.recurso.update({ where: { id: recursoId }, data: { colorOverride: colorId } });
  revalidatePath("/recursos");
}

export async function eliminarRecurso(recursoId: string) {
  const docente = await requireDocente();
  const r = await prisma.recurso.findUnique({ where: { id: recursoId } });
  if (!r || r.docenteId !== docente.id) throw new Error("No encontrado.");
  await prisma.recurso.delete({ where: { id: recursoId } });
  if (r.storagePath) await deleteFile(r.storagePath).catch(() => {});
  revalidatePath("/recursos");
}
