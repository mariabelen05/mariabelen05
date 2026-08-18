import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const docente = await prisma.docente.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (!docente) return null;

        const valid = await bcrypt.compare(password, docente.passwordHash);
        if (!valid) return null;

        return {
          id: docente.id,
          email: docente.email,
          name: docente.nombre,
          image: docente.fotoUrl ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.docenteId = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.docenteId as string;
      }
      return session;
    },
  },
});
