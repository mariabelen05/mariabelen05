"use server";

import bcrypt from "bcryptjs";
import { unlink } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { requireDocente, signOutAction } from "@/lib/actions/session-actions";
import { revalidatePath } from "next/cache";

export type PerfilState = { error?: string; success?: string } | undefined;

export async function actualizarPerfil(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const docente = await requireDocente();
  const nombre = String(formData.get("nombre") || "").trim();
  const edad = String(formData.get("edad") || "");
  const provincia = String(formData.get("provincia") || "") || null;
  const modalidad = String(formData.get("modalidad") || "") || null;

  if (!nombre) return { error: "El nombre no puede estar vacío." };

  await prisma.docente.update({
    where: { id: docente.id },
    data: { nombre, edad: edad ? Number(edad) : null, provincia, modalidad },
  });
  revalidatePath("/perfil");
  return { success: "Perfil actualizado." };
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
    [...documentos, ...recursos].map((f) => (f.storagePath ? unlink(f.storagePath).catch(() => {}) : null))
  );

  await signOutAction();
}
