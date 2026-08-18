"use client";

import { useTransition } from "react";
import { eliminarRecurso } from "@/lib/actions/recursos-actions";
import { FileIcon, TrashIcon } from "@/components/icons";
import type { Recurso } from "@prisma/client";

export function RecursoRow({
  recurso,
}: {
  recurso: Recurso & { planificacion: { titulo: string } | null };
}) {
  const [pending, startTransition] = useTransition();
  const tags = recurso.tags ? (JSON.parse(recurso.tags) as string[]) : [];

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-soft text-purple">
          <FileIcon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-text">{recurso.titulo}</div>
          {recurso.planificacion && <div className="truncate text-[11px] text-text-faint">{recurso.planificacion.titulo}</div>}
        </div>
        <button
          disabled={pending}
          onClick={() => startTransition(() => eliminarRecurso(recurso.id))}
          className="shrink-0 text-danger disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      {recurso.descripcion && <p className="text-xs text-text-faint">{recurso.descripcion}</p>}
      {recurso.url && (
        <a href={recurso.url} target="_blank" rel="noreferrer" className="truncate text-xs font-semibold text-primary">
          {recurso.url}
        </a>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span key={i} className="rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-bold text-text-faint">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
