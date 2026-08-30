import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDocente } from "@/lib/actions/session-actions";
import { downloadFile } from "@/lib/storage";

export const runtime = "nodejs";

// Serves an image inserted into an evaluación's canvas — same ownership
// check as everywhere else: only the docente who owns the evaluación can
// fetch it.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imagenId: string }> }
) {
  const { id, imagenId } = await params;
  const docente = await requireDocente();

  const imagen = await prisma.evaluacionImagen.findUnique({ where: { id: imagenId } });
  if (!imagen || imagen.evaluacionId !== id) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }
  const evaluacion = await prisma.evaluacion.findUnique({ where: { id } });
  if (!evaluacion || evaluacion.docenteId !== docente.id) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await downloadFile(imagen.storagePath);
  } catch {
    return NextResponse.json({ error: "La imagen no está disponible." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
