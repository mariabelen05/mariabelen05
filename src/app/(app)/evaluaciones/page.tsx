import { requireDocente } from "@/lib/actions/session-actions";
import { prisma } from "@/lib/prisma";
import { crearEvaluacion, agregarItemBanco } from "@/lib/actions/evaluaciones-actions";
import { EvaluacionRow } from "./evaluacion-row";
import { ItemBancoRow } from "./item-row";
import { CheckIcon } from "@/components/icons";

export default async function EvaluacionesPage() {
  const docente = await requireDocente();

  const [evaluaciones, items, planificaciones] = await Promise.all([
    prisma.evaluacion.findMany({
      where: { docenteId: docente.id },
      orderBy: { createdAt: "desc" },
      include: { planificacion: { select: { titulo: true } } },
    }),
    prisma.itemBanco.findMany({ where: { docenteId: docente.id }, orderBy: { createdAt: "desc" } }),
    prisma.planificacion.findMany({ where: { docenteId: docente.id }, select: { id: true, titulo: true } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Evaluaciones</h1>
        <p className="text-sm text-text-faint">Tus instrumentos de evaluación y tu banco de preguntas.</p>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-text">
          <CheckIcon className="h-4 w-4 text-primary" /> Evaluaciones
        </div>
        <form action={crearEvaluacion} className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-4">
          <input name="titulo" required placeholder="Título" className="min-w-[160px] flex-1 rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
          <select name="tipo" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]" defaultValue="">
            <option value="">Tipo</option>
            <option value="escrita">Escrita</option>
            <option value="oral">Oral</option>
            <option value="trabajo practico">Trabajo práctico</option>
          </select>
          <select name="planificacionId" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]" defaultValue="">
            <option value="">Sin vincular</option>
            {planificaciones.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
          </select>
          <button type="submit" className="rounded-[10px] bg-primary px-4 py-2 text-[13px] font-bold text-white">Crear</button>
        </form>
        <div className="flex flex-col gap-2">
          {evaluaciones.length === 0 ? (
            <p className="text-sm text-text-faint">Todavía no creaste ninguna evaluación.</p>
          ) : (
            evaluaciones.map((e) => <EvaluacionRow key={e.id} evaluacion={e} />)
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="text-sm font-extrabold text-text">Banco de preguntas</div>
        <form action={agregarItemBanco} className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
          <textarea name="enunciado" required rows={2} placeholder="Enunciado de la pregunta" className="resize-none rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
          <div className="grid gap-2 sm:grid-cols-3">
            <select name="tipo" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]" defaultValue="desarrollo">
              <option value="opcion_multiple">Opción múltiple</option>
              <option value="desarrollo">Desarrollo</option>
              <option value="verdadero_falso">Verdadero / Falso</option>
            </select>
            <input name="tema" placeholder="Tema" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
            <select name="dificultad" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]" defaultValue="">
              <option value="">Dificultad</option>
              <option value="facil">Fácil</option>
              <option value="media">Media</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
          <textarea name="opciones" rows={2} placeholder="Opciones (una por línea, opcional)" className="resize-none rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
          <input name="respuestaCorrecta" placeholder="Respuesta correcta (opcional)" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
          <button type="submit" className="w-fit rounded-[10px] bg-primary px-4 py-2 text-[13px] font-bold text-white">Agregar al banco</button>
        </form>
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <p className="text-sm text-text-faint">Tu banco de preguntas está vacío.</p>
          ) : (
            items.map((i) => <ItemBancoRow key={i.id} item={i} />)
          )}
        </div>
      </section>
    </div>
  );
}
