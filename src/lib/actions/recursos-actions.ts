"use server";

import path from "node:path";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { revalidatePath } from "next/cache";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

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
  if (archivo instanceof File && archivo.size > 0) {
    const dirDocente = path.join(UPLOADS_DIR, docente.id, "recursos");
    await mkdir(dirDocente, { recursive: true });
    storagePath = path.join(dirDocente, `${randomUUID()}-${archivo.name}`);
    await writeFile(storagePath, Buffer.from(await archivo.arrayBuffer()));
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
    },
  });
  revalidatePath("/recursos");
}

export async function eliminarRecurso(recursoId: string) {
  const docente = await requireDocente();
  const r = await prisma.recurso.findUnique({ where: { id: recursoId } });
  if (!r || r.docenteId !== docente.id) throw new Error("No encontrado.");
  await prisma.recurso.delete({ where: { id: recursoId } });
  if (r.storagePath) await unlink(r.storagePath).catch(() => {});
  revalidatePath("/recursos");
}
