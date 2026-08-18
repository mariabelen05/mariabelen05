import Link from "next/link";
import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import { PlusIcon, ChalkboardIcon } from "@/components/icons";

const ESTADO_LABEL: Record<string, { label: string; fg: string; bg: string }> = {
  BORRADOR: { label: "Borrador", fg: "text-text-faint", bg: "bg-surface" },
  EN_PROGRESO: { label: "En curso", fg: "text-primary", bg: "bg-primary-soft" },
  FINALIZADA: { label: "Completa", fg: "text-success", bg: "bg-success-soft" },
};

export default async function PlanificacionesPage() {
  const docente = await requireDocente();

  const planes = await prisma.planificacion.findMany({
    where: { OR: [{ docenteId: docente.id }, { colaboradores: { some: { docenteId: docente.id } } }] },
    orderBy: { updatedAt: "desc" },
    include: { colaboradores: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Planificaciones</h1>
          <p className="text-sm text-text-faint">Historial de todo lo que armaste — y lo que compartieron con vos.</p>
        </div>
        <Link
          href="/planificaciones/nueva"
          className="flex items-center gap-2 rounded-[11px] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
        >
          <PlusIcon className="h-4 w-4" /> Nueva planificación
        </Link>
      </div>

      {planes.length === 0 ? (
        <div className="flex flex-col items-center gap-3.5 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-purple-soft text-purple">
            <PlusIcon className="h-[22px] w-[22px]" />
          </div>
          <div className="text-[14.5px] font-bold text-text">Todavía no armaste ninguna planificación</div>
          <Link href="/planificaciones/nueva" className="text-sm font-bold text-primary">
            Creá la primera →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {planes.map((p) => {
            const estado = ESTADO_LABEL[p.estado];
            const esColaboracion = p.docenteId !== docente.id;
            return (
              <Link
                key={p.id}
                href={`/planificaciones/${p.id}`}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-soft text-purple">
                  <ChalkboardIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold text-text">{p.titulo}</div>
                  <div className="text-xs text-text-faint">
                    {p.materia ?? "Sin materia"} {p.curso ? `— ${p.curso}` : ""}
                    {esColaboracion && " · Compartida con vos"}
                    {" · "}
                    Actualizada {p.updatedAt.toLocaleDateString("es-AR")}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${estado.fg} ${estado.bg}`}>
                  {estado.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
