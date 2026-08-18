import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { ColaboradoresPanel } from "@/components/planificacion/colaboradores-panel";
import type { PlanCollaborator } from "@prisma/client";

const STEPS = [
  { n: 1, label: "Objetivos y contenidos", slug: "paso-1" },
  { n: 2, label: "Metodología y actividades", slug: "paso-2" },
  { n: 3, label: "Evaluación y coherencia", slug: "paso-3" },
  { n: 4, label: "Resultado final", slug: "paso-4" },
];

export function StepLayout({
  planId,
  titulo,
  current,
  estados,
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

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        {STEPS.map((s, i) => {
          const estado = estados[i];
          const active = s.n === current;
          const completo = estado === "COMPLETADO";
          return (
            <div key={s.n} className="flex items-center gap-2">
              <Link
                href={`/planificaciones/${planId}/${s.slug}`}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-bold transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : completo
                    ? "bg-success-soft text-success"
                    : "bg-surface text-text-faint"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    active ? "bg-white/25" : completo ? "bg-success text-white" : "bg-white"
                  }`}
                >
                  {completo && !active ? <CheckIcon className="h-3 w-3" /> : s.n}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </Link>
              {i < STEPS.length - 1 && <div className="h-px w-4 bg-border sm:w-6" />}
            </div>
          );
        })}
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
