"use server";

import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { revalidatePath } from "next/cache";
import { RECURSO_COLOR_ORDER } from "@/lib/recurso-colors";
import { buildStorageKey, uploadFile, deleteFile } from "@/lib/storage";

export async function crearRecurso(formData: FormData) {
  const docente = await requireDocente();
  const titulo = String(formData.get("titulo") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const planificacionId = String(formData.get("planificacionId") || "") || null;
  const url = String(formData.get("url") || "").trim() || null;
  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw ? JSON.stringify(tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)) : null;
  const archivo = formData.get("archivo");

  if (!titulo) throw new Error("Ingresá un título.");

  let storagePath: string | null = null;
  let mimeType: string | null = null;
  if (archivo instanceof File && archivo.size > 0) {
    storagePath = buildStorageKey(docente.id, archivo.name, "recursos");
    await uploadFile(storagePath, Buffer.from(await archivo.arrayBuffer()), archivo.type || undefined);
    mimeType = archivo.type || null;
  }

  if (!storagePath && !url) throw new Error("Subí un archivo o pegá un enlace.");

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
