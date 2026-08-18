import mammoth from "mammoth";

// Extracted text feeds directly into Claude prompts as grounding context —
// see docs/privacidad-ley-25326.md for what that implies for data handling.
export type ExtraccionResultado = { texto: string } | { error: string };

export async function extraerTexto(buffer: Buffer, mimeType: string): Promise<ExtraccionResultado> {
  try {
    if (mimeType === "application/pdf") {
      return await extraerPdf(buffer);
    }
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const { value } = await mammoth.extractRawText({ buffer });
      if (!value.trim()) return { error: "No se encontró texto en el documento Word." };
      return { texto: value.trim() };
    }
    if (mimeType.startsWith("image/")) {
      return await extraerImagenOcr(buffer);
    }
    if (mimeType === "text/plain") {
      const texto = buffer.toString("utf-8").trim();
      if (!texto) return { error: "El archivo de texto está vacío." };
      return { texto };
    }
    return { error: `Tipo de archivo no soportado para extracción: ${mimeType}` };
  } catch (err) {
    return { error: `Error al procesar el documento: ${(err as Error).message}` };
  }
}

async function extraerPdf(buffer: Buffer): Promise<ExtraccionResultado> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  await parser.destroy();
  const texto = data.text.trim();
  if (texto.length < 20) {
    return {
      error:
        "El PDF no tiene texto extraíble (parece escaneado como imagen). Por ahora Aulera no convierte páginas de PDF a imagen para OCR automático: subí cada página como imagen (JPG/PNG) para que se procese con OCR.",
    };
  }
  return { texto };
}

async function extraerImagenOcr(buffer: Buffer): Promise<ExtraccionResultado> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["spa", "eng"]);
  try {
    const { data } = await worker.recognize(buffer);
    const texto = data.text.trim();
    if (!texto) return { error: "No se pudo reconocer texto en la imagen (OCR)." };
    return { texto };
  } finally {
    await worker.terminate();
  }
}
