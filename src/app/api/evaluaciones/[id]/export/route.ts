import { NextRequest, NextResponse } from "next/server";
import { getEvaluacionConAcceso } from "@/lib/actions/evaluaciones-actions";
import { downloadFile } from "@/lib/storage";
import { segmentarContenido } from "@/lib/evaluacion-canvas";
import type { EvaluacionContenido } from "@/lib/evaluacion-types";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, HeadingLevel, ImageRun } from "docx";

export const runtime = "nodejs";

function slug(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
}

type ImagenResuelta = { bytes: Buffer; width: number; height: number };

// Loads the actual bytes + stored dimensions for every image referenced in
// the canvas, keyed by id, so both exporters can look them up while walking
// the text/image segments in document order.
async function resolverImagenes(evaluacionId: string, ids: string[]): Promise<Map<string, ImagenResuelta>> {
  if (!ids.length) return new Map();
  const filas = await prisma.evaluacionImagen.findMany({ where: { id: { in: ids }, evaluacionId } });
  const entradas = await Promise.all(
    filas.map(async (f) => {
      const bytes = await downloadFile(f.storagePath);
      return [f.id, { bytes, width: f.width, height: f.height }] as const;
    })
  );
  return new Map(entradas);
}

function scaleImage(width: number, height: number, maxW: number, maxH: number) {
  let w = width;
  let h = height;
  if (w > maxW) {
    h = h * (maxW / w);
    w = maxW;
  }
  if (h > maxH) {
    w = w * (maxH / h);
    h = maxH;
  }
  return { width: Math.round(w), height: Math.round(h) };
}

async function buildPdf(titulo: string, tipo: string | null, contenido: EvaluacionContenido, imagenes: Map<string, ImagenResuelta>): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text(titulo);
  if (tipo) doc.fontSize(10).fillColor("#555").text(tipo);
  doc.fillColor("#000").moveDown();

  for (const seg of segmentarContenido(contenido.texto)) {
    if (seg.tipo === "texto") {
      if (seg.valor.trim()) doc.fontSize(11).text(seg.valor);
    } else {
      const img = imagenes.get(seg.id);
      if (img) {
        doc.moveDown(0.3);
        doc.image(img.bytes, { fit: [500, 650], align: "center" });
        doc.moveDown(0.3);
      }
    }
  }

  doc.end();
  return done;
}

async function buildDocx(titulo: string, tipo: string | null, contenido: EvaluacionContenido, imagenes: Map<string, ImagenResuelta>): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: titulo, heading: HeadingLevel.TITLE }),
    ...(tipo ? [new Paragraph({ text: tipo })] : []),
    new Paragraph({ text: "" }),
  ];

  for (const seg of segmentarContenido(contenido.texto)) {
    if (seg.tipo === "texto") {
      children.push(...seg.valor.split("\n").map((linea) => new Paragraph({ text: linea })));
    } else {
      const img = imagenes.get(seg.id);
      if (img) {
        const { width, height } = scaleImage(img.width, img.height, 550, 700);
        children.push(
          new Paragraph({
            children: [new ImageRun({ type: "png", data: img.bytes, transformation: { width, height } })],
          })
        );
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") === "docx" ? "docx" : "pdf";

  const { evaluacion } = await getEvaluacionConAcceso(id);
  if (!evaluacion.contenido) {
    return NextResponse.json({ error: "Esta evaluación todavía no tiene contenido para exportar." }, { status: 400 });
  }
  const contenido = JSON.parse(evaluacion.contenido) as EvaluacionContenido;
  if (!contenido.texto.trim()) {
    return NextResponse.json({ error: "Esta evaluación todavía no tiene contenido para exportar." }, { status: 400 });
  }

  const segmentos = segmentarContenido(contenido.texto);
  const idsImagenes = segmentos.filter((s) => s.tipo === "imagen").map((s) => (s as { tipo: "imagen"; id: string }).id);
  const imagenes = await resolverImagenes(id, idsImagenes);

  const filename = `${slug(evaluacion.titulo)}.${format}`;

  if (format === "docx") {
    const buffer = await buildDocx(evaluacion.titulo, evaluacion.tipo, contenido, imagenes);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const buffer = await buildPdf(evaluacion.titulo, evaluacion.tipo, contenido, imagenes);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
