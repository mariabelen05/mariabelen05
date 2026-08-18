import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "./upload-form";
import { DocumentoRow } from "./documento-row";

export default async function DocumentosPage() {
  const docente = await requireDocente();

  const [documentos, planificaciones] = await Promise.all([
    prisma.documento.findMany({
      where: { docenteId: docente.id },
      orderBy: { createdAt: "desc" },
      include: { planificacion: { select: { titulo: true } } },
    }),
    prisma.planificacion.findMany({
      where: { docenteId: docente.id },
      select: { id: true, titulo: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Documentos</h1>
        <p className="text-sm text-text-faint">
          Subí normativa, diseños curriculares o programas institucionales. Aulera extrae el texto
          (con OCR si hace falta) para usarlo como base cuando genere sugerencias — así no inventa
          contenido normativo.
        </p>
      </div>

      <UploadForm planificaciones={planificaciones} />

      <div className="flex flex-col gap-2.5">
        {documentos.length === 0 ? (
          <p className="rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card px-6 py-10 text-center text-sm text-text-faint">
            Todavía no subiste ningún documento.
          </p>
        ) : (
          documentos.map((d) => <DocumentoRow key={d.id} documento={d} />)
        )}
      </div>
    </div>
  );
}
