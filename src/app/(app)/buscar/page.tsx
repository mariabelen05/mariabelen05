import Link from "next/link";
import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import { FolderIcon, FileIcon, ArchiveIcon, CheckIcon, SearchIcon } from "@/components/icons";

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  EN_PROGRESO: "En curso",
  FINALIZADA: "Completa",
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const docente = await requireDocente();

  const [planificaciones, documentos, recursos, evaluaciones] = query
    ? await Promise.all([
        prisma.planificacion.findMany({
          where: { docenteId: docente.id, titulo: { contains: query, mode: "insensitive" } },
          select: { id: true, titulo: true, materia: true, curso: true, estado: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.documento.findMany({
          where: { docenteId: docente.id, nombreArchivo: { contains: query, mode: "insensitive" } },
          select: { id: true, nombreArchivo: true, clasificacion: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.recurso.findMany({
          where: { docenteId: docente.id, titulo: { contains: query, mode: "insensitive" } },
          select: { id: true, titulo: true, tipo: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.evaluacion.findMany({
          where: { docenteId: docente.id, titulo: { contains: query, mode: "insensitive" } },
          select: { id: true, titulo: true, tipo: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
      ])
    : [[], [], [], []];

  const totalResultados = planificaciones.length + documentos.length + recursos.length + evaluaciones.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Buscar</h1>
        {query ? (
          <p className="text-sm text-text-faint">
            {totalResultados === 0
              ? `Sin resultados para "${query}".`
              : `${totalResultados} resultado${totalResultados === 1 ? "" : "s"} para "${query}".`}
          </p>
        ) : (
          <p className="text-sm text-text-faint">Escribí algo en la barra de búsqueda de arriba para empezar.</p>
        )}
      </div>

      {query && totalResultados === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card px-6 py-14 text-center">
          <SearchIcon className="h-6 w-6 text-text-faint" />
          <p className="text-sm text-text-faint">
            No encontramos nada que coincida con &quot;{query}&quot; en planificaciones, documentos, recursos o
            evaluaciones.
          </p>
        </div>
      )}

      {planificaciones.length > 0 && (
        <ResultSection titulo="Planificaciones" Icon={FolderIcon} count={planificaciones.length}>
          {planificaciones.map((p) => (
            <ResultRow
              key={p.id}
              href={`/planificaciones/${p.id}`}
              titulo={p.titulo}
              subtitulo={[p.materia, p.curso].filter(Boolean).join(" · ") || undefined}
              meta={ESTADO_LABEL[p.estado] ?? p.estado}
              fecha={p.updatedAt}
            />
          ))}
        </ResultSection>
      )}

      {documentos.length > 0 && (
        <ResultSection titulo="Documentos" Icon={FileIcon} count={documentos.length}>
          {documentos.map((d) => (
            <ResultRow
              key={d.id}
              href="/documentos"
              titulo={d.nombreArchivo}
              subtitulo={d.clasificacion ?? undefined}
              fecha={d.createdAt}
            />
          ))}
        </ResultSection>
      )}

      {recursos.length > 0 && (
        <ResultSection titulo="Recursos" Icon={ArchiveIcon} count={recursos.length}>
          {recursos.map((r) => (
            <ResultRow
              key={r.id}
              href="/recursos"
              titulo={r.titulo}
              meta={r.tipo === "enlace" ? "Enlace" : "Archivo"}
              fecha={r.createdAt}
            />
          ))}
        </ResultSection>
      )}

      {evaluaciones.length > 0 && (
        <ResultSection titulo="Evaluaciones" Icon={CheckIcon} count={evaluaciones.length}>
          {evaluaciones.map((e) => (
            <ResultRow
              key={e.id}
              href={`/evaluaciones/${e.id}`}
              titulo={e.titulo}
              subtitulo={e.tipo ?? undefined}
              fecha={e.updatedAt}
            />
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({
  titulo,
  Icon,
  count,
  children,
}: {
  titulo: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-text-faint" />
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-text-faint">
          {titulo} <span className="text-text-faint/70">· {count}</span>
        </h2>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ResultRow({
  href,
  titulo,
  subtitulo,
  meta,
  fecha,
}: {
  href: string;
  titulo: string;
  subtitulo?: string;
  meta?: string;
  fecha: Date;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-surface"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-text">{titulo}</div>
        {(subtitulo || meta) && (
          <div className="truncate text-xs text-text-faint">
            {[subtitulo, meta].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
      <div className="shrink-0 text-xs text-text-faint">{fecha.toLocaleDateString("es-AR")}</div>
    </Link>
  );
}
