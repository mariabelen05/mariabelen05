"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const RegistroSchema = z.object({
  nombre: z.string().min(2, "Ingresá tu nombre completo"),
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  edad: z.string().optional(),
  provincia: z.string().optional(),
  modalidad: z.string().optional(),
});

export type ActionState = { error?: string } | undefined;

// Paso 1 del onboarding: crea el Docente con sus datos personales y lo loguea.
export async function registrarDocente(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = RegistroSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
    edad: formData.get("edad") ?? undefined,
    provincia: formData.get("provincia") ?? undefined,
    modalidad: formData.get("modalidad") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { nombre, email, password, edad, provincia, modalidad } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const existente = await prisma.docente.findUnique({ where: { email: emailNorm } });
  if (existente) {
    return { error: "Ya existe una cuenta registrada con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.docente.create({
    data: {
      nombre,
      email: emailNorm,
      passwordHash,
      edad: edad ? Number(edad) : null,
      provincia: provincia || null,
      modalidad: modalidad || null,
    },
  });

  try {
    await signIn("credentials", {
      email: emailNorm,
      password,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "No se pudo iniciar sesión automáticamente. Probá desde /login." };
    }
    throw err;
  }
}

export async function loginDocente(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Completá email y contraseña." };
  }

  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }
    throw err;
  }
}
