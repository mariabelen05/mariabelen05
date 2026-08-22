import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import { RecursoForm } from "./recurso-form";
import { RecursoRow } from "./recurso-row";

export default async function RecursosPage() {
  const docente = await requireDocente();

  const [recursos, planificaciones] = await Promise.all([
    prisma.recurso.findMany({
      where: { docenteId: docente.id },
      orderBy: { createdAt: "desc" },
      include: { planificacion: { select: { titulo: true } } },
    }),
    prisma.planificacion.findMany({ where: { docenteId: docente.id }, select: { id: true, titulo: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Recursos</h1>
        <p className="text-sm text-text-faint">Materiales y enlaces que usás en tus clases.</p>
      </div>

      <RecursoForm planificaciones={planificaciones} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recursos.length === 0 ? (
          <p className="col-span-full text-center text-sm text-text-faint">Todavía no cargaste recursos.</p>
        ) : (
          recursos.map((r) => <RecursoRow key={r.id} recurso={r} />)
        )}
      </div>
    </div>
  );
}
