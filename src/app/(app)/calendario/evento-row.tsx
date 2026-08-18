"use client";

import { useTransition } from "react";
import { eliminarEvento } from "@/lib/actions/calendario-actions";
import { TrashIcon } from "@/components/icons";
import type { EventoCalendario } from "@prisma/client";

export function EventoRow({ evento }: { evento: EventoCalendario }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-soft text-primary">
        <span className="text-[13px] font-extrabold leading-none">{evento.fecha.getUTCDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-text">{evento.titulo}</div>
        <div className="text-[11px] capitalize text-text-faint">{evento.tipo}</div>
      </div>
      <button
        disabled={pending}
        onClick={() => startTransition(() => eliminarEvento(evento.id))}
        className="shrink-0 text-danger disabled:opacity-50"
        aria-label="Eliminar"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
