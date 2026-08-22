"use client";

import { useTransition } from "react";
import Link from "next/link";
import { eliminarEvaluacion } from "@/lib/actions/evaluaciones-actions";
import { TrashIcon } from "@/components/icons";
import type { Evaluacion } from "@prisma/client";

export function EvaluacionRow({
  evaluacion,
}: {
  evaluacion: Evaluacion & { planificacion: { titulo: string } | null };
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <Link href={`/evaluaciones/${evaluacion.id}`} className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-text hover:text-primary">{evaluacion.titulo}</div>
        <div className="text-[11px] text-text-faint">
          {evaluacion.tipo ?? "Sin tipo"}{evaluacion.planificacion && ` · ${evaluacion.planificacion.titulo}`}
        </div>
      </Link>
      <button
        disabled={pending}
        onClick={() => startTransition(() => eliminarEvaluacion(evaluacion.id))}
        className="text-danger disabled:opacity-50"
        aria-label="Eliminar"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
