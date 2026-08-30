// Shared between the client canvas editor and server-side code (image
// upload cleanup, PDF/Word export) — no Node-only imports here so it stays
// importable from "use client" components.
//
// An evaluación's `contenido.texto` is plain text; an inserted image is
// represented as a standalone line holding this exact token, so the AI
// generate/ajustar calls (which only ever see/produce plain text) can be
// told to leave it untouched instead of needing real image awareness.
export function tokenImagen(imagenId: string): string {
  return `[[img:${imagenId}]]`;
}

const IMG_LINE_RE = /^\[\[img:([a-zA-Z0-9]+)\]\]$/;

export type SegmentoContenido =
  | { tipo: "texto"; valor: string }
  | { tipo: "imagen"; id: string };

// Splits on image-token lines, coalescing the plain-text runs between them
// (rather than one segment per line) so the canvas can render each run as a
// single growing textarea instead of one per line.
export function segmentarContenido(texto: string): SegmentoContenido[] {
  const lineas = texto.split("\n");
  const segmentos: SegmentoContenido[] = [];
  let actual: string[] = [];

  const cerrarTexto = () => {
    segmentos.push({ tipo: "texto", valor: actual.join("\n") });
    actual = [];
  };

  for (const linea of lineas) {
    const m = linea.match(IMG_LINE_RE);
    if (m) {
      cerrarTexto();
      segmentos.push({ tipo: "imagen", id: m[1] });
    } else {
      actual.push(linea);
    }
  }
  cerrarTexto();
  return segmentos;
}

export function unirSegmentos(segmentos: SegmentoContenido[]): string {
  return segmentos
    .map((s) => (s.tipo === "imagen" ? tokenImagen(s.id) : s.valor))
    .join("\n");
}

export function extraerIdsImagenes(texto: string): string[] {
  return segmentarContenido(texto)
    .filter((s): s is { tipo: "imagen"; id: string } => s.tipo === "imagen")
    .map((s) => s.id);
}

// Splits the text segment at `destino` (a caret position the canvas last
// recorded focus in) into "before"/"after" and drops the image segment
// between them — this is how "Insertar imagen" places the image exactly
// where the docente's cursor was. Falls back to appending at the very end
// when there's no recorded caret (e.g. the canvas was never focused yet).
export function insertarImagenEnSegmentos(
  segmentos: SegmentoContenido[],
  destino: { segmentIndex: number; pos: number } | null,
  imagenId: string
): SegmentoContenido[] {
  if (!segmentos.length) return [{ tipo: "imagen", id: imagenId }, { tipo: "texto", valor: "" }];

  let idx = segmentos.length - 1;
  const ultimo = segmentos[idx];
  let pos = ultimo.tipo === "texto" ? ultimo.valor.length : 0;
  const objetivo = destino ? segmentos[destino.segmentIndex] : undefined;
  if (destino && objetivo?.tipo === "texto") {
    idx = destino.segmentIndex;
    pos = destino.pos;
  }

  const seg = segmentos[idx];
  if (seg.tipo !== "texto") {
    return [...segmentos.slice(0, idx + 1), { tipo: "imagen", id: imagenId }, ...segmentos.slice(idx + 1)];
  }
  return [
    ...segmentos.slice(0, idx),
    { tipo: "texto", valor: seg.valor.slice(0, pos) },
    { tipo: "imagen", id: imagenId },
    { tipo: "texto", valor: seg.valor.slice(pos) },
    ...segmentos.slice(idx + 1),
  ];
}
