import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { InicioSubidaDirecta } from "@/lib/actions/upload-actions";

let client: SupabaseClient | null = null;

// Only usable when the app is configured for direct-to-Supabase uploads
// (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY set at build time) — the anon key is
// safe to ship to the browser, it's rate-limited/RLS-scoped, not a secret.
// Returns null when unset so callers fall back to the server-routed upload.
function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}

// Uploads `archivo` straight from the browser to Supabase Storage using a
// signed URL from `iniciar` — the file bytes never pass through a Server
// Action. Returns null (never an error, "not configured") when either half
// of the setup — the browser's public keys or the server's Supabase Storage
// config — is missing, so the caller can transparently fall back to the
// traditional through-the-server upload instead of failing the whole flow.
// Returns `{ error }` (rather than throwing) when the file was rejected or
// the upload itself failed, so callers show that message as-is.
export async function subirArchivoDirecto(
  archivo: File,
  folder: string | undefined,
  iniciar: (nombreArchivo: string, tamano: number, folder?: string) => Promise<InicioSubidaDirecta>
): Promise<{ path: string } | { error: string } | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const inicio = await iniciar(archivo.name, archivo.size, folder);
  if (!inicio.soportado) return inicio.error ? { error: inicio.error } : null;

  const { error } = await supabase.storage
    .from(inicio.bucket)
    .uploadToSignedUrl(inicio.path, inicio.token, archivo, { contentType: archivo.type || undefined });
  if (error) return { error: `No se pudo subir el archivo: ${error.message}` };

  return { path: inicio.path };
}
