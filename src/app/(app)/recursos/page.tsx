import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import { crearRecurso } from "@/lib/actions/recursos-actions";
import { RecursoRow } from "./recurso-row";
import { ArchiveIcon } from "@/components/icons";

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

      <form action={crearRecurso} className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-text">
          <ArchiveIcon className="h-4 w-4 text-purple" /> Nuevo recurso
        </div>
        <input name="titulo" required placeholder="Título" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="file" name="archivo" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
          <input name="url" placeholder="…o pegá un enlace" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="tags" placeholder="Etiquetas separadas por coma" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
          <select name="planificacionId" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]" defaultValue="">
            <option value="">Sin vincular</option>
            {planificaciones.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
          </select>
        </div>
        <textarea name="descripcion" rows={2} placeholder="Descripción (opcional)" className="resize-none rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
        <button type="submit" className="w-fit rounded-[10px] bg-primary px-5 py-2.5 text-[13px] font-bold text-white">Guardar recurso</button>
      </form>

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
