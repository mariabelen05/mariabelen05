"use server";

import { signOut, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

// Every server action / route that touches a docente's data should call this
// first: it guarantees we never read or write another docente's rows.
export async function requireDocente() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const docente = await prisma.docente.findUnique({ where: { id: session.user.id } });
  if (!docente) redirect("/login");
  return docente;
}
