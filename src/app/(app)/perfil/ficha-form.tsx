"use client";

import { useActionState } from "react";
import { actualizarFicha } from "@/lib/actions/perfil-actions";
import type { Docente } from "@prisma/client";

export function FichaForm({
  docente,
  provincias,
}: {
  docente: Docente;
  provincias: string[];
}) {
  const [state, formAction, pending] = useActionState(actualizarFicha, undefined);
  const materias = docente.materias ? (JSON.parse(docente.materias) as string[]).join(", ") : "";

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-sm font-extrabold text-text">Ficha institucional</h2>
        <p className="mt-1 text-xs text-text-faint">
          Todo opcional. Si la completás, Aulera la usa como membrete al elegir &quot;Institución&quot;
          en Nueva planificación — no vas a tener que volver a escribirla cada vez.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Institución</span>
        <input
          name="institucion"
          defaultValue={docente.institucion ?? ""}
          placeholder="Escuela N.º 12 &quot;Manuel Belgrano&quot;"
          className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Provincia</span>
          <select
            name="provincia"
            defaultValue={docente.provincia ?? ""}
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Sin especificar</option>
            {provincias.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Localidad</span>
          <input
            name="localidad"
            defaultValue={docente.localidad ?? ""}
            placeholder="Bahía Blanca"
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Niveles / materias que dictás en general</span>
        <input
          name="materias"
          defaultValue={materias}
          placeholder="Primaria, Matemática, Ciencias Naturales"
          className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <span className="text-xs text-text-faint">Separados por coma.</span>
      </label>

      {state?.error && <p className="rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{state.error}</p>}
      {state?.success && <p className="rounded-[10px] bg-success-soft px-3.5 py-2.5 text-[13px] text-success">{state.success}</p>}

      <button type="submit" disabled={pending} className="w-fit rounded-[11px] bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar ficha"}
      </button>
    </form>
  );
}
