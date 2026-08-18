import { crearPlanificacion } from "@/lib/actions/planificacion-actions";

export default async function NuevaPlanificacionPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const tipoLabel =
    tipo === "anual" ? "Planificación anual" : tipo === "secuencia" ? "Secuencia didáctica" : "Plan de clase";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-primary">{tipoLabel}</span>
        <h1 className="text-2xl font-extrabold text-text">Nueva planificación</h1>
        <p className="text-sm text-text-faint">
          Contanos qué querés armar, en tus palabras. Aulera te va a proponer objetivos y contenidos
          en el paso siguiente — vos revisás y aprobás cada parte.
        </p>
      </div>

      <form action={crearPlanificacion} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Título de la planificación</span>
          <input
            name="titulo"
            required
            placeholder="Matemática — Funciones — 3.º año"
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text">Materia</span>
            <input
              name="materia"
              placeholder="Matemática"
              className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text">Curso / año</span>
            <input
              name="curso"
              placeholder="3.º año"
              className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">
            ¿Qué querés que aprendan tus estudiantes?
          </span>
          <textarea
            name="contextoLibre"
            required
            rows={5}
            placeholder="Ej: Quiero que mis alumnos comprendan las causas de la Revolución Industrial y sus consecuencias sociales."
            className="resize-none rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
          <span className="text-xs text-text-faint">
            Cuanto más contexto des, mejor va a ser la propuesta inicial. Después vas a poder pedir
            ajustes con el asistente lateral en cada paso.
          </span>
        </label>

        <button
          type="submit"
          className="mt-2 w-fit rounded-[11px] bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover"
        >
          Continuar al paso 1
        </button>
      </form>
    </div>
  );
}
