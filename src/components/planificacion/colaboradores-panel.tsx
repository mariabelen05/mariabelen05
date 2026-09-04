"use client";

import { useState, useTransition } from "react";
import {
  invitarColaborador, cambiarRolColaborador, quitarColaborador,
} from "@/lib/actions/planificacion-actions";
import { UserIcon } from "@/components/icons";
import { mensajeError } from "@/lib/error-message";
import type { PlanCollaborator } from "@prisma/client";

export function ColaboradoresPanel({
  planId,
  colaboradores,
  esOwner,
}: {
  planId: string;
  colaboradores: PlanCollaborator[];
  esOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<"EDITOR" | "VISOR">("VISOR");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const invitar = () => {
    if (!email.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await invitarColaborador(planId, email, rol);
        setEmail("");
      } catch (e) {
        setError(mensajeError(e, "enviar la invitación"));
      }
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-bold text-text"
      >
        <UserIcon className="h-3.5 w-3.5" />
        {colaboradores.length > 0 ? `${colaboradores.length} colaborador(es)` : "Compartir"}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-[320px] rounded-2xl border border-border bg-card p-4 shadow-[0_20px_50px_-12px_rgba(30,35,64,0.25)]">
          <div className="mb-2 text-[13px] font-bold text-text">Co-planificación</div>

          {colaboradores.length > 0 && (
            <div className="mb-3 flex flex-col gap-2">
              {colaboradores.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-xl bg-surface p-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-text">{c.email}</div>
                    <div className="text-[10.5px] text-text-faint">
                      {c.estado === "PENDIENTE" ? "Invitación pendiente" : "Activo"}
                    </div>
                  </div>
                  {esOwner ? (
                    <>
                      <select
                        value={c.rol}
                        onChange={(e) =>
                          startTransition(() =>
                            cambiarRolColaborador(planId, c.id, e.target.value as "EDITOR" | "VISOR")
                          )
                        }
                        className="rounded-md border border-border bg-card px-1.5 py-1 text-[11px]"
                      >
                        <option value="VISOR">Solo ver</option>
                        <option value="EDITOR">Puede editar</option>
                      </select>
                      <button
                        onClick={() => startTransition(() => quitarColaborador(planId, c.id))}
                        className="text-[11px] font-bold text-danger"
                      >
                        Quitar
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-text-faint">
                      {c.rol === "EDITOR" ? "Puede editar" : "Solo ver"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {esOwner && (
            <div className="flex flex-col gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@docente.com"
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as "EDITOR" | "VISOR")}
                  className="flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-[12px]"
                >
                  <option value="VISOR">Solo ver y comentar</option>
                  <option value="EDITOR">Puede editar</option>
                </select>
                <button
                  onClick={invitar}
                  disabled={pending}
                  className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
                >
                  Invitar
                </button>
              </div>
              {error && <p className="text-[11px] text-danger">{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
