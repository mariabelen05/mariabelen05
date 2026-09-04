import Link from "next/link";
import { ColaboradoresPanel } from "@/components/planificacion/colaboradores-panel";
import type { PlanCollaborator } from "@prisma/client";

// La barra de pasos (antes acá) ahora vive en el layout compartido de
// /planificaciones/[id] como <DirectionAwareTabs>, para que no se desmonte
// entre pasos y pueda animar la transición según la dirección. `current` y
// `estados` quedan sin uso en este componente pero se mantienen en las
// llamadas existentes de cada paso-N/page.tsx para no tocar esas páginas.
export function StepLayout({
  planId,
  titulo,
  colaboradores,
  esOwner,
  ultimaEdicion,
  children,
}: {
  planId: string;
  titulo: string;
  current: number;
  estados: [string, string, string, string]; // paso1..4 Estado
  colaboradores: PlanCollaborator[];
  esOwner: boolean;
  ultimaEdicion?: { nombre: string; fecha: Date } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link href="/planificaciones" className="w-fit text-xs font-bold text-text-faint hover:text-primary">
            ← Volver a planificaciones
          </Link>
          <h1 className="text-xl font-extrabold text-text sm:text-2xl">{titulo}</h1>
          {ultimaEdicion && (
            <span className="text-[11.5px] font-semibold text-text-faint">
              Editado por {ultimaEdicion.nombre} · {ultimaEdicion.fecha.toLocaleDateString("es-AR")}
            </span>
          )}
        </div>
        <ColaboradoresPanel planId={planId} colaboradores={colaboradores} esOwner={esOwner} />
      </div>

      {children}
    </div>
  );
}

export function SuggestionBadge({ estado }: { estado: string }) {
  if (estado === "sugerencia") {
    return (
      <span className="w-fit rounded-full bg-purple-soft px-2.5 py-1 text-[11px] font-bold text-purple">
        ✨ Sugerencia de Aulera — revisala y aprobala
      </span>
    );
  }
  if (estado === "editado") {
    return (
      <span className="w-fit rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-bold text-warning">
        Editado por vos
      </span>
    );
  }
  return (
    <span className="w-fit rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
      Aprobado
    </span>
  );
}
