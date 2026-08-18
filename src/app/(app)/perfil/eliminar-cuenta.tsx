"use client";

import { useState, useTransition } from "react";
import { eliminarCuenta } from "@/lib/actions/perfil-actions";

export function EliminarCuenta() {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-card p-6">
      <h2 className="text-sm font-extrabold text-danger">Eliminar cuenta</h2>
      <p className="text-xs text-text-faint">
        Borra tu cuenta y todo tu contenido — planificaciones, documentos, evaluaciones y
        recursos — de forma permanente. Esta acción no se puede deshacer.
      </p>
      {!confirmando ? (
        <button
          onClick={() => setConfirmando(true)}
          className="w-fit rounded-[11px] border border-danger px-5 py-2 text-[13px] font-bold text-danger hover:bg-danger-soft"
        >
          Eliminar mi cuenta
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-danger">¿Confirmás? No se puede deshacer.</span>
          <button
            disabled={pending}
            onClick={() => startTransition(() => eliminarCuenta())}
            className="rounded-[11px] bg-danger px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
          >
            {pending ? "Eliminando…" : "Sí, eliminar todo"}
          </button>
          <button onClick={() => setConfirmando(false)} className="rounded-[11px] border border-border px-4 py-2 text-[13px] font-bold text-text">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
