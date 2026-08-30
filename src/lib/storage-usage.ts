import { prisma } from "@/lib/prisma";

// Supabase Storage's free-tier total bucket quota — not read from an API
// (Supabase doesn't expose remaining quota), just the documented number.
// See MAX_DIRECT_UPLOAD_BYTES in upload-limits.ts for the matching per-file cap.
export const ALMACENAMIENTO_CUOTA_BYTES = 1024 * 1024 * 1024;

// Sums `tamano` across every row that owns a file in the bucket (Documentos,
// file-type Recursos, and Evaluación images) — the same bucket the free
// tier's 1GB project-wide quota applies to. Rows created before this column
// existed count as 0 bytes, so this undercounts older uploads; good enough
// as a "how close are we to the quota" signal, not an exact figure.
export async function obtenerUsoAlmacenamiento(): Promise<{ usadoBytes: number; cuotaBytes: number }> {
  const [documentos, recursos, imagenes] = await Promise.all([
    prisma.documento.aggregate({ _sum: { tamano: true } }),
    prisma.recurso.aggregate({ _sum: { tamano: true }, where: { tipo: "archivo" } }),
    prisma.evaluacionImagen.aggregate({ _sum: { tamano: true } }),
  ]);
  const usadoBytes =
    (documentos._sum.tamano ?? 0) + (recursos._sum.tamano ?? 0) + (imagenes._sum.tamano ?? 0);
  return { usadoBytes, cuotaBytes: ALMACENAMIENTO_CUOTA_BYTES };
}

export function formatearBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
