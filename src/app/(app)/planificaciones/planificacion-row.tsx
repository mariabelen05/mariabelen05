"use client";

import { useState } from "react";
import Link from "next/link";
import { eliminarPlanificacion } from "@/lib/actions/planificacion-actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ChalkboardIcon, ChevronDownIcon } from "@/components/icons";
import { ExpandableCard } from "@/components/ui/expandable-card";

const ESTADO_LABEL: Record<string, { label: string; fg: string; bg: string }> = {
  BORRADOR: { label: "Borrador", fg: "text-text-faint", bg: "bg-surface" },
  EN_PROGRESO: { label: "En curso", fg: "text-primary", bg: "bg-primary-soft" },
  FINALIZADA: { label: "Completa", fg: "text-success", bg: "bg-success-soft" },
};

export function PlanificacionRow({
  plan,
  esCreador,
}: {
  plan: {
    id: string;
    titulo: string;
    materia: string | null;
    curso: string | null;
    estado: string;
    updatedAt: Date;
  };
  esCreador: boolean;
}) {
  const [open, setOpen] = useState(false);
  const estado = ESTADO_LABEL[plan.estado];

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3.5">
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3.5"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-soft text-purple">
            <ChalkboardIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-bold text-text">{plan.titulo}</div>
            <div className="text-xs text-text-faint">
              {plan.materia ?? "Sin materia"} {plan.curso ? `— ${plan.curso}` : ""}
              {!esCreador && " · Compartida con vos"}
              {" · "}
              Actualizada {plan.updatedAt.toLocaleDateString("es-AR")}
            </div>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-text-faint transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${estado.fg} ${estado.bg}`}>
          {estado.label}
        </span>
        {esCreador && (
          <ConfirmDeleteButton
            onDelete={() => eliminarPlanificacion(plan.id)}
            confirmText="¿Eliminar esta planificación? No se puede deshacer."
          />
        )}
      </div>

      <ExpandableCard open={open}>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-3.5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <dt className="text-text-faint">Materia</dt>
            <dd className="font-semibold text-text">{plan.materia ?? "Sin especificar"}</dd>
            <dt className="text-text-faint">Curso / año</dt>
            <dd className="font-semibold text-text">{plan.curso ?? "Sin especificar"}</dd>
            <dt className="text-text-faint">Estado</dt>
            <dd className={`font-semibold ${estado.fg}`}>{estado.label}</dd>
            <dt className="text-text-faint">Última actualización</dt>
            <dd className="font-semibold text-text">{plan.updatedAt.toLocaleDateString("es-AR")}</dd>
          </dl>
          <Link
            href={`/planificaciones/${plan.id}`}
            className="shrink-0 rounded-[10px] bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover"
          >
            Abrir planificación →
          </Link>
        </div>
      </ExpandableCard>
    </div>
  );
}
