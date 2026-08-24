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
// payload limit. 25MB comfortably covers scanned multi-page PDFs, dense
// DOCX/PPTX, or a chart-heavy image, while keeping upload time reasonable
// on the slower rural/low-connectivity connections this app is meant to
// support, and staying well under Supabase's default 50MB per-file cap and
// the free tier's 1GB total bucket quota.
export const MAX_DIRECT_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_DIRECT_UPLOAD_LABEL = "25MB";
