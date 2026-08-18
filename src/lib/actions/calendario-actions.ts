"use server";

import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { revalidatePath } from "next/cache";

export async function crearEvento(formData: FormData) {
  const docente = await requireDocente();
  const titulo = String(formData.get("titulo") || "").trim();
  const fecha = String(formData.get("fecha") || "");
  const tipo = String(formData.get("tipo") || "otro");
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const planificacionId = String(formData.get("planificacionId") || "") || null;

  if (!titulo || !fecha) throw new Error("Completá título y fecha.");

  await prisma.eventoCalendario.create({
    data: { docenteId: docente.id, titulo, fecha: new Date(fecha), tipo, descripcion, planificacionId },
  });
  revalidatePath("/calendario");
}

export async function eliminarEvento(eventoId: string) {
  const docente = await requireDocente();
  const evento = await prisma.eventoCalendario.findUnique({ where: { id: eventoId } });
  if (!evento || evento.docenteId !== docente.id) throw new Error("No encontrado.");
  await prisma.eventoCalendario.delete({ where: { id: eventoId } });
  revalidatePath("/calendario");
}
