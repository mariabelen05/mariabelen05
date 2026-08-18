"use client";

import { useActionState } from "react";
import { actualizarPerfil } from "@/lib/actions/perfil-actions";
import type { Docente } from "@prisma/client";

export function PerfilForm({
  docente,
  provincias,
  modalidades,
}: {
  docente: Docente;
  provincias: string[];
  modalidades: { value: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(actualizarPerfil, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-sm font-extrabold text-text">Datos personales</h2>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Nombre completo</span>
        <input name="nombre" defaultValue={docente.nombre} required className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Edad (opcional)</span>
        <input name="edad" type="number" defaultValue={docente.edad ?? ""} className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Provincia</span>
        <select name="provincia" defaultValue={docente.provincia ?? ""} className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">Sin especificar</option>
          {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Modalidad</span>
        <select name="modalidad" defaultValue={docente.modalidad ?? ""} className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">Sin especificar</option>
          {modalidades.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </label>

      {state?.error && <p className="rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{state.error}</p>}
      {state?.success && <p className="rounded-[10px] bg-success-soft px-3.5 py-2.5 text-[13px] text-success">{state.success}</p>}

      <button type="submit" disabled={pending} className="w-fit rounded-[11px] bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
