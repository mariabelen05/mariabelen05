"use client";

import { useTransition } from "react";
import { eliminarItemBanco } from "@/lib/actions/evaluaciones-actions";
import { TrashIcon } from "@/components/icons";
import type { ItemBanco } from "@prisma/client";

const DIFICULTAD_BG: Record<string, string> = {
  facil: "bg-success-soft text-success",
  media: "bg-warning-soft text-warning",
  dificil: "bg-danger-soft text-danger",
};

export function ItemBancoRow({ item }: { item: ItemBanco }) {
  const [pending, startTransition] = useTransition();
  const opciones = item.opciones ? (JSON.parse(item.opciones) as string[]) : [];

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-text">{item.enunciado}</div>
          {opciones.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-[12px] text-text-faint">
              {opciones.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-bold text-text-faint">{item.tipo}</span>
            {item.tema && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10.5px] font-bold text-primary">{item.tema}</span>}
            {item.dificultad && (
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${DIFICULTAD_BG[item.dificultad] ?? ""}`}>
                {item.dificultad}
              </span>
            )}
          </div>
        </div>
        <button
          disabled={pending}
          onClick={() => startTransition(() => eliminarItemBanco(item.id))}
          className="shrink-0 text-danger disabled:opacity-50"
          aria-label="Eliminar"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
