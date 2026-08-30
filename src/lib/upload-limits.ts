// Shared between client and server code, so it can't depend on
// server-only modules (node:fs, the Supabase server client, etc.) the way
// src/lib/storage.ts does.
//
// Kept under the serverActions.bodySizeLimit in next.config.ts (which itself
// stays under Vercel's 4.5MB hard cap on Serverless Function payloads), so a
// file this size never gets rejected at the framework layer before our own
// validation (and its friendly error message) can run. This is the ceiling
// when a file is uploaded through the server — the fallback used when direct
// browser -> Storage upload isn't configured (see MAX_DIRECT_UPLOAD_BYTES).
export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "3.5MB";

// Ceiling for direct browser -> Supabase Storage uploads (signed URL) —
// bytes never pass through a Vercel function, so this isn't bound by its
// payload limit. 50MB is the free-tier Supabase Storage project's actual
// per-file cap (raising it further requires a paid plan), not a number we
// chose. NOTE: the free tier's total bucket quota is 1GB project-wide, so a
// handful of files at this size fills it fast — there's no per-file check
// against remaining quota, only Supabase's own "over quota" error at upload
// time (surfaced to the user via subirArchivoDirecto, not swallowed).
// Monitor usage in the Supabase dashboard and reconsider this ceiling (or
// add a usage check) if uploads are frequent and large in practice.
export const MAX_DIRECT_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_DIRECT_UPLOAD_LABEL = "50MB";
