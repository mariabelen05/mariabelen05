"use server";

import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { revalidatePath } from "next/cache";

export async function crearEvaluacion(formData: FormData) {
  const docente = await requireDocente();
  const titulo = String(formData.get("titulo") || "").trim();
  const tipo = String(formData.get("tipo") || "") || null;
  const planificacionId = String(formData.get("planificacionId") || "") || null;
  if (!titulo) throw new Error("Ingresá un título.");

  await prisma.evaluacion.create({ data: { docenteId: docente.id, titulo, tipo, planificacionId } });
  revalidatePath("/evaluaciones");
}

export async function eliminarEvaluacion(evaluacionId: string) {
  const docente = await requireDocente();
  const ev = await prisma.evaluacion.findUnique({ where: { id: evaluacionId } });
  if (!ev || ev.docenteId !== docente.id) throw new Error("No encontrada.");
  await prisma.evaluacion.delete({ where: { id: evaluacionId } });
  revalidatePath("/evaluaciones");
}

export async function agregarItemBanco(formData: FormData) {
  const docente = await requireDocente();
  const enunciado = String(formData.get("enunciado") || "").trim();
  const tipo = String(formData.get("tipo") || "desarrollo");
  const tema = String(formData.get("tema") || "").trim() || null;
  const dificultad = String(formData.get("dificultad") || "") || null;
  const opcionesRaw = String(formData.get("opciones") || "").trim();
  const respuestaCorrecta = String(formData.get("respuestaCorrecta") || "").trim() || null;
  const evaluacionId = String(formData.get("evaluacionId") || "") || null;

  if (!enunciado) throw new Error("Ingresá el enunciado.");

  const opciones = opcionesRaw
    ? JSON.stringify(opcionesRaw.split("\n").map((o) => o.trim()).filter(Boolean))
    : null;

  await prisma.itemBanco.create({
    data: { docenteId: docente.id, enunciado, tipo, tema, dificultad, opciones, respuestaCorrecta, evaluacionId },
  });
  revalidatePath("/evaluaciones");
}

export async function eliminarItemBanco(itemId: string) {
  const docente = await requireDocente();
  const item = await prisma.itemBanco.findUnique({ where: { id: itemId } });
  if (!item || item.docenteId !== docente.id) throw new Error("No encontrado.");
  await prisma.itemBanco.delete({ where: { id: itemId } });
  revalidatePath("/evaluaciones");
}
