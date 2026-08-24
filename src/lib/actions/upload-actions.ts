"use server";

import { requireDocente } from "@/lib/actions/session-actions";
import { crearSubidaFirmada, subidaDirectaDisponible } from "@/lib/storage";
import { MAX_DIRECT_UPLOAD_BYTES, MAX_DIRECT_UPLOAD_LABEL } from "@/lib/upload-limits";

export type InicioSubidaDirecta =
  | { soportado: true; path: string; token: string; bucket: string }
  // `error` set means "don't fall back, show this to the user" (e.g. the file
  // is over the limit even for direct upload); absent means "not configured
  // here, fall back to the traditional through-the-server upload" — see
  // subirArchivoDirecto. Returned rather than thrown because Next.js redacts
  // thrown Server Action errors to a generic digest in production builds.
  | { soportado: false; error?: string };

// Called before the browser uploads anything, so the size limit is enforced
// server-side even though the bytes themselves will bypass the server
// entirely.
export async function iniciarSubidaDirecta(
  nombreArchivo: string,
  tamano: number,
  folder?: string
): Promise<InicioSubidaDirecta> {
  const docente = await requireDocente();
  if (!subidaDirectaDisponible()) return { soportado: false };
  if (tamano > MAX_DIRECT_UPLOAD_BYTES) {
    return {
      soportado: false,
      error: `El archivo pesa demasiado. El tamaño máximo permitido es ${MAX_DIRECT_UPLOAD_LABEL}.`,
    };
  }
  const { path, token, bucket } = await crearSubidaFirmada(docente.id, nombreArchivo, folder);
  return { soportado: true, path, token, bucket };
}
