// Color-by-type palette for Recurso cards. Each entry's `id` is what gets
// stored in Recurso.colorOverride when a docente picks a color manually —
// keeping overrides restricted to this palette (instead of free-form hex)
// keeps every card visually consistent with the rest of the design system.
export type RecursoColorId =
  | "pdf" | "word" | "excel" | "powerpoint" | "video" | "imagen" | "link" | "otro";

export const RECURSO_COLOR_PALETTE: Record<RecursoColorId, { label: string; bg: string; accent: string }> = {
  pdf: { label: "PDF", bg: "#FDE2E2", accent: "#E5484D" },
  word: { label: "Word", bg: "#DCE7FA", accent: "#3B5FE0" },
  excel: { label: "Excel", bg: "#DFF5E3", accent: "#34A853" },
  powerpoint: { label: "PowerPoint", bg: "#FCE8D6", accent: "#FF8A5B" },
  video: { label: "Video", bg: "#EDE9FE", accent: "#7C6FF0" },
  imagen: { label: "Imagen", bg: "#FEF3D9", accent: "#F0A93E" },
  link: { label: "Link / Drive", bg: "#D9F2F0", accent: "#14B8A6" },
  otro: { label: "Otro", bg: "#EEEEF2", accent: "#9296B0" },
};

export const RECURSO_COLOR_ORDER: RecursoColorId[] = [
  "pdf", "word", "excel", "powerpoint", "video", "imagen", "link", "otro",
];

const EXT_MAP: Record<string, RecursoColorId> = {
  pdf: "pdf",
  doc: "word", docx: "word", odt: "word", rtf: "word",
  xls: "excel", xlsx: "excel", csv: "excel", ods: "excel",
  ppt: "powerpoint", pptx: "powerpoint", odp: "powerpoint",
  mp4: "video", mov: "video", avi: "video", mkv: "video", webm: "video",
  jpg: "imagen", jpeg: "imagen", png: "imagen", gif: "imagen", webp: "imagen", svg: "imagen", bmp: "imagen",
};

function fromExtension(nombre: string | null | undefined): RecursoColorId | null {
  if (!nombre) return null;
  const ext = nombre.split(".").pop()?.toLowerCase();
  return (ext && EXT_MAP[ext]) || null;
}

function fromMimeType(mimeType: string | null | undefined): RecursoColorId | null {
  if (!mimeType) return null;
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("wordprocessingml") || mimeType === "application/msword") return "word";
  if (mimeType.includes("spreadsheetml") || mimeType === "application/vnd.ms-excel" || mimeType === "text/csv") return "excel";
  if (mimeType.includes("presentationml") || mimeType === "application/vnd.ms-powerpoint") return "powerpoint";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "imagen";
  return null;
}

// Automatic type detection: explicit override wins, then mimeType, then the
// uploaded filename's extension (covers rows saved before mimeType existed),
// then "link" for URL resources, falling back to "otro".
export function detectRecursoColor(recurso: {
  tipo: string;
  url?: string | null;
  mimeType?: string | null;
  colorOverride?: string | null;
  storagePath?: string | null;
}): RecursoColorId {
  if (recurso.colorOverride && recurso.colorOverride in RECURSO_COLOR_PALETTE) {
    return recurso.colorOverride as RecursoColorId;
  }
  if (recurso.tipo === "enlace" || (!recurso.storagePath && recurso.url)) return "link";
  return fromMimeType(recurso.mimeType) ?? fromExtension(recurso.storagePath) ?? "otro";
}
