"use client";

import Link from "next/link";
import { eliminarPlanificacion } from "@/lib/actions/planificacion-actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ChalkboardIcon } from "@/components/icons";

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
  const estado = ESTADO_LABEL[plan.estado];

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4">
      <Link href={`/planificaciones/${plan.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
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
      </Link>
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
  );
}
