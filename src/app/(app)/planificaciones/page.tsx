import Link from "next/link";
import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import { PlusIcon } from "@/components/icons";
import { PlanificacionRow } from "./planificacion-row";
import { NuevaRapidaPopover } from "./nueva-rapida-popover";

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
        <NuevaRapidaPopover
          trigger={
            <span className="flex items-center gap-2 rounded-[11px] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover">
              <PlusIcon className="h-4 w-4" /> Nueva planificación
            </span>
          }
        />
      </div>

      {planes.length === 0 ? (
        <div className="flex flex-col items-center gap-3.5 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card px-6 py-16 text-center">
          <NuevaRapidaPopover
            align="bottom-start"
            trigger={
              <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-purple-soft text-purple hover:bg-purple/20">
                <PlusIcon className="h-[22px] w-[22px]" />
              </div>
            }
          />
          <div className="text-[14.5px] font-bold text-text">Todavía no armaste ninguna planificación</div>
          <p className="text-sm font-bold text-primary">Tocá el + para crear la primera</p>
          <p className="text-xs font-normal text-text-faint">
            ¿Preferís el formulario completo con contexto e institución?{" "}
            <Link href="/planificaciones/nueva" className="font-bold text-primary">
              Usá esta otra opción
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {planes.map((p) => (
            <PlanificacionRow key={p.id} plan={p} esCreador={p.docenteId === docente.id} />
          ))}
        </div>
      )}
    </div>
  );
}
