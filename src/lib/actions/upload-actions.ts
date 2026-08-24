"use server";

import { requireDocente } from "@/lib/actions/session-actions";
import { crearSubidaFirmada, subidaDirectaDisponible } from "@/lib/storage";
import { MAX_DIRECT_UPLOAD_BYTES, MAX_DIRECT_UPLOAD_LABEL } from "@/lib/upload-limits";

export type InicioSubidaDirecta =
  | { soportado: true; path: string; token: string; bucket: string }
  | { soportado: false };

// Called before the browser uploads anything, so the size limit is enforced
// server-side even though the bytes themselves will bypass the server
// entirely. Returns { soportado: false } when Supabase Storage isn't
// configured (local dev without credentials) — callers fall back to
// uploading through the existing Server Action path in that case.
export async function iniciarSubidaDirecta(
  nombreArchivo: string,
  tamano: number,
  folder?: string
): Promise<InicioSubidaDirecta> {
  const docente = await requireDocente();
  if (!subidaDirectaDisponible()) return { soportado: false };
  if (tamano > MAX_DIRECT_UPLOAD_BYTES) {
    throw new Error(`El archivo pesa demasiado. El tamaño máximo permitido es ${MAX_DIRECT_UPLOAD_LABEL}.`);
  }
  const { path, token, bucket } = await crearSubidaFirmada(docente.id, nombreArchivo, folder);
  return { soportado: true, path, token, bucket };
}
