import path from "node:path";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// File storage for Documentos/Recursos uploads. Uses Supabase Storage when
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (required in production —
// Vercel's filesystem is read-only, so writing to local disk there fails with
// ENOENT). Falls back to local disk under ./uploads when those aren't set,
// so `npm run dev` keeps working without needing real cloud credentials —
// the same local/cloud split the project already uses for Postgres
// (docker-compose locally, Supabase in prod).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "aulera-uploads";

// Statically scoped (not built from env) so Next's file tracing doesn't
// bundle the whole project — see the Turbopack warning this used to trigger.
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// Whether Documentos/Recursos can offer a direct browser -> Storage upload
// (signed URL) instead of routing the file through a Server Action. Local
// disk has no equivalent, so this is only ever true alongside usingSupabase.
export function subidaDirectaDisponible(): boolean {
  return usingSupabase;
}

let client: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

let bucketEnsured = false;
async function ensureBucket() {
  if (bucketEnsured) return;
  const { data } = await supabase().storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase().storage.createBucket(BUCKET, { public: false });
    // Ignore a race where another request created it first.
    if (error && !/already exists/i.test(error.message)) throw new Error(`No se pudo crear el bucket de almacenamiento: ${error.message}`);
  }
  bucketEnsured = true;
}

// Builds a unique storage key scoped to the docente (and an optional
// subfolder, e.g. "recursos"), so uploads never collide and deletion by key
// alone is unambiguous.
export function buildStorageKey(docenteId: string, filename: string, folder?: string): string {
  return [docenteId, folder, `${randomUUID()}-${filename}`].filter(Boolean).join("/");
}

// Issues a short-lived (2h), single-use signed URL the browser can upload
// straight to Storage with — the file bytes never pass through a Vercel
// Serverless Function, so this is how Documentos/Recursos get past the
// platform's ~4.5MB request body limit. Only callable when usingSupabase.
export async function crearSubidaFirmada(
  docenteId: string,
  filename: string,
  folder?: string
): Promise<{ path: string; token: string; bucket: string }> {
  await ensureBucket();
  const key = buildStorageKey(docenteId, filename, folder);
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUploadUrl(key);
  if (error || !data) {
    throw new Error(`No se pudo iniciar la subida: ${error?.message ?? "error desconocido"}`);
  }
  return { path: data.path, token: data.token, bucket: BUCKET };
}

export async function uploadFile(key: string, bytes: Buffer, contentType?: string): Promise<void> {
  if (usingSupabase) {
    await ensureBucket();
    const { error } = await supabase()
      .storage.from(BUCKET)
      .upload(key, bytes, { contentType: contentType || "application/octet-stream", upsert: false });
    if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);
    return;
  }
  const fullPath = path.join(LOCAL_UPLOADS_DIR, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
}

export async function downloadFile(key: string): Promise<Buffer> {
  if (usingSupabase) {
    const { data, error } = await supabase().storage.from(BUCKET).download(key);
    if (error || !data) throw new Error(`No se pudo leer el archivo: ${error?.message ?? "no encontrado"}`);
    return Buffer.from(await data.arrayBuffer());
  }
  return readFile(path.join(LOCAL_UPLOADS_DIR, key));
}

export async function deleteFile(key: string): Promise<void> {
  if (usingSupabase) {
    const { error } = await supabase().storage.from(BUCKET).remove([key]);
    if (error) throw new Error(error.message);
    return;
  }
  await unlink(path.join(LOCAL_UPLOADS_DIR, key));
}
