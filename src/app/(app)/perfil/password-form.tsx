"use client";

import { useActionState } from "react";
import { cambiarPassword } from "@/lib/actions/perfil-actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(cambiarPassword, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-sm font-extrabold text-text">Cambiar contraseña</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Contraseña actual</span>
        <input name="actual" type="password" required className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text">Nueva contraseña</span>
        <input name="nueva" type="password" required minLength={8} className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
      </label>

      {state?.error && <p className="rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{state.error}</p>}
      {state?.success && <p className="rounded-[10px] bg-success-soft px-3.5 py-2.5 text-[13px] text-success">{state.success}</p>}

      <button type="submit" disabled={pending} className="w-fit rounded-[11px] border border-border bg-card px-6 py-2.5 text-sm font-bold text-text hover:bg-surface disabled:opacity-60">
        {pending ? "Actualizando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
