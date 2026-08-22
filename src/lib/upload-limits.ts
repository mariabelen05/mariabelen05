// Shared between client and server code, so it can't depend on
// server-only modules (node:fs, the Supabase server client, etc.) the way
// src/lib/storage.ts does.
//
// Kept under the serverActions.bodySizeLimit in next.config.ts (which itself
// stays under Vercel's 4.5MB hard cap on Serverless Function payloads), so a
// file this size never gets rejected at the framework layer before our own
// validation (and its friendly error message) can run.
export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "3.5MB";
