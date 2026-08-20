import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { downloadFile } from "@/lib/storage";

export const runtime = "nodejs";

// Serves an uploaded Recurso's file so it's actually openable after upload,
// not just listed. Access follows the same rule as everywhere else in
// Recursos: only the docente who owns the row can fetch it.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docente = await requireDocente();

  const recurso = await prisma.recurso.findUnique({ where: { id } });
  if (!recurso || recurso.docenteId !== docente.id || !recurso.storagePath) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await downloadFile(recurso.storagePath);
  } catch {
    return NextResponse.json({ error: "El archivo no está disponible." }, { status: 404 });
  }

  const filename = path.basename(recurso.storagePath).replace(/^[^-]+-/, "");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": recurso.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
