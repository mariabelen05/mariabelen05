import { NextRequest, NextResponse } from "next/server";
import { getPlanConAcceso } from "@/lib/actions/planificacion-actions";
import { planSections, type PlanExportData } from "@/lib/planificacion-export";
import type {
  ObjetivosContenidos, MetodologiaActividades, InstrumentoEvaluacion, CoherenciaReporte,
} from "@/lib/planificacion-types";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export const runtime = "nodejs";

function slug(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
}

async function loadData(planId: string): Promise<PlanExportData | null> {
  const { plan, docente } = await getPlanConAcceso(planId);
  if (!plan.objetivosContenidos || !plan.metodologiaActividades || !plan.instrumentoEvaluacion) return null;
  return {
    titulo: plan.titulo,
    materia: plan.materia,
    curso: plan.curso,
    provincia: plan.provincia,
    docenteNombre: docente.nombre,
    objetivos: JSON.parse(plan.objetivosContenidos) as ObjetivosContenidos,
    metodologia: JSON.parse(plan.metodologiaActividades) as MetodologiaActividades,
    evaluacion: JSON.parse(plan.instrumentoEvaluacion) as InstrumentoEvaluacion,
    coherencia: plan.coherenciaReporte ? (JSON.parse(plan.coherenciaReporte) as CoherenciaReporte) : null,
  };
}

async function buildPdf(data: PlanExportData): Promise<Buffer> {
  const s = planSections(data);
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text(s.encabezado[0], { align: "left" });
  doc.fontSize(10).fillColor("#555").text(s.encabezado[1]);
  doc.text(s.encabezado[2]);
  doc.moveDown();

  doc.fillColor("#000").fontSize(13).text("Objetivo general", { underline: true });
  doc.fontSize(11).text(s.objetivoGeneral);
  doc.moveDown(0.5);

  doc.fontSize(13).text("Objetivos específicos", { underline: true });
  s.objetivosEspecificos.forEach((o) => doc.fontSize(11).text(`• ${o}`));
  doc.moveDown(0.5);

  doc.fontSize(13).text("Unidades de contenido", { underline: true });
  s.unidades.forEach((u) => {
    doc.fontSize(11).text(u.titulo, { continued: false });
    u.subtemas.forEach((st) => doc.fontSize(10).fillColor("#333").text(`   – ${st}`));
    doc.fillColor("#000");
  });
  doc.moveDown(0.5);

  doc.fontSize(13).text("Metodología", { underline: true });
  doc.fontSize(11).text(s.metodologia);
  doc.moveDown(0.5);

  doc.fontSize(13).text("Actividades", { underline: true });
  s.actividades.forEach((a) => {
    doc.fontSize(12).text(a.label);
    a.lineas.forEach((l) => doc.fontSize(10).fillColor("#333").text(l));
    doc.fillColor("#000").moveDown(0.3);
  });

  doc.fontSize(13).text("Evaluación", { underline: true });
  doc.fontSize(11).text(s.instrumento);
  s.criterios.forEach((c) => doc.fontSize(10).text(`• ${c}`));

  if (s.coherencia.length) {
    doc.moveDown(0.5);
    doc.fontSize(13).text("Advertencias de coherencia pedagógica", { underline: true });
    s.coherencia.forEach((c) => doc.fontSize(10).fillColor("#a15c00").text(`• ${c}`));
    doc.fillColor("#000");
  }

  doc.end();
  return done;
}

async function buildDocx(data: PlanExportData): Promise<Buffer> {
  const s = planSections(data);
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: s.encabezado[0], heading: HeadingLevel.TITLE }),
          new Paragraph({ text: s.encabezado[1] }),
          new Paragraph({ text: s.encabezado[2] }),
          new Paragraph({ text: "" }),

          new Paragraph({ text: "Objetivo general", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: s.objetivoGeneral }),

          new Paragraph({ text: "Objetivos específicos", heading: HeadingLevel.HEADING_2 }),
          ...s.objetivosEspecificos.map((o) => new Paragraph({ text: o, bullet: { level: 0 } })),

          new Paragraph({ text: "Unidades de contenido", heading: HeadingLevel.HEADING_2 }),
          ...s.unidades.flatMap((u) => [
            new Paragraph({ children: [new TextRun({ text: u.titulo, bold: true })] }),
            ...u.subtemas.map((st) => new Paragraph({ text: st, bullet: { level: 1 } })),
          ]),

          new Paragraph({ text: "Metodología", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: s.metodologia }),

          new Paragraph({ text: "Actividades", heading: HeadingLevel.HEADING_2 }),
          ...s.actividades.flatMap((a) => [
            new Paragraph({ children: [new TextRun({ text: a.label, bold: true })] }),
            ...a.lineas.map((l) => new Paragraph({ text: l })),
          ]),

          new Paragraph({ text: "Evaluación", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: s.instrumento }),
          ...s.criterios.map((c) => new Paragraph({ text: c, bullet: { level: 0 } })),

          ...(s.coherencia.length
            ? [
                new Paragraph({ text: "Advertencias de coherencia pedagógica", heading: HeadingLevel.HEADING_2 }),
                ...s.coherencia.map((c) => new Paragraph({ text: c, bullet: { level: 0 } })),
              ]
            : []),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") === "docx" ? "docx" : "pdf";

  const data = await loadData(id);
  if (!data) {
    return NextResponse.json({ error: "La planificación todavía no tiene los 3 pasos completos." }, { status: 400 });
  }

  const filename = `${slug(data.titulo)}.${format}`;

  if (format === "docx") {
    const buffer = await buildDocx(data);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const buffer = await buildPdf(data);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
