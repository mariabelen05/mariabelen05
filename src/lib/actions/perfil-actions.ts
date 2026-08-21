"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireDocente, signOutAction } from "@/lib/actions/session-actions";
import { revalidatePath } from "next/cache";
import { deleteFile } from "@/lib/storage";

export type PerfilState = { error?: string; success?: string } | undefined;

export async function actualizarPerfil(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const docente = await requireDocente();
  const nombre = String(formData.get("nombre") || "").trim();
  const edad = String(formData.get("edad") || "");
  const modalidad = String(formData.get("modalidad") || "") || null;

  if (!nombre) return { error: "El nombre no puede estar vacío." };

  await prisma.docente.update({
    where: { id: docente.id },
    data: { nombre, edad: edad ? Number(edad) : null, modalidad },
  });
  revalidatePath("/perfil");
  return { success: "Perfil actualizado." };
}

// Ficha institucional — todo opcional, vive solo acá (nunca en /registro). Modo A
// en Nueva planificación la usa como membrete cuando está completa.
export async function actualizarFicha(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const docente = await requireDocente();
  const institucion = String(formData.get("institucion") || "").trim() || null;
  const provincia = String(formData.get("provincia") || "").trim() || null;
  const localidad = String(formData.get("localidad") || "").trim() || null;
  const materiasRaw = String(formData.get("materias") || "").trim();
  const materias = materiasRaw
    ? JSON.stringify(materiasRaw.split(",").map((m) => m.trim()).filter(Boolean))
    : null;

  await prisma.docente.update({
    where: { id: docente.id },
    data: { institucion, provincia, localidad, materias },
  });
  revalidatePath("/perfil");
  return { success: "Ficha institucional actualizada." };
}

export async function cambiarPassword(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const docente = await requireDocente();
  const actual = String(formData.get("actual") || "");
  const nueva = String(formData.get("nueva") || "");

  if (nueva.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };

  const valido = await bcrypt.compare(actual, docente.passwordHash);
  if (!valido) return { error: "La contraseña actual no es correcta." };

  const passwordHash = await bcrypt.hash(nueva, 10);
  await prisma.docente.update({ where: { id: docente.id }, data: { passwordHash } });
  return { success: "Contraseña actualizada." };
}

// Derecho de supresión (Ley 25.326, art. 16): borra la cuenta y todo el
// contenido propio del docente. Ver docs/privacidad-ley-25326.md.
export async function eliminarCuenta() {
  const docente = await requireDocente();

  const [documentos, recursos] = await Promise.all([
    prisma.documento.findMany({ where: { docenteId: docente.id }, select: { storagePath: true } }),
    prisma.recurso.findMany({ where: { docenteId: docente.id, storagePath: { not: null } }, select: { storagePath: true } }),
  ]);

  await prisma.$transaction([
    prisma.planActivity.deleteMany({ where: { docenteId: docente.id } }),
    prisma.itemBanco.deleteMany({ where: { docenteId: docente.id } }),
    prisma.evaluacion.deleteMany({ where: { docenteId: docente.id } }),
    prisma.documento.deleteMany({ where: { docenteId: docente.id } }),
    prisma.recurso.deleteMany({ where: { docenteId: docente.id } }),
    prisma.eventoCalendario.deleteMany({ where: { docenteId: docente.id } }),
    prisma.planCollaborator.deleteMany({ where: { docenteId: docente.id } }),
    prisma.planificacion.deleteMany({ where: { docenteId: docente.id } }),
    prisma.docente.delete({ where: { id: docente.id } }),
  ]);

  await Promise.all(
    [...documentos, ...recursos].map((f) => (f.storagePath ? deleteFile(f.storagePath).catch(() => {}) : null))
  );

  await signOutAction();
}
