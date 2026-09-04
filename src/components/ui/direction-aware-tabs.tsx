"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { CheckIcon } from "@/components/icons";

const STEPS = [
  { n: 1, label: "Objetivos y contenidos", slug: "paso-1" },
  { n: 2, label: "Metodología y actividades", slug: "paso-2" },
  { n: 3, label: "Evaluación y coherencia", slug: "paso-3" },
  { n: 4, label: "Resultado final", slug: "paso-4" },
];

export function DirectionAwareTabs({
  basePath,
  estados,
}: {
  /** Prefijo de ruta al que se agrega "/paso-N", ej. `/planificaciones/${id}` */
  basePath: string;
  estados: [string, string, string, string];
}) {
  const pathname = usePathname();
  const current = STEPS.find((s) => pathname.endsWith(`/${s.slug}`))?.n ?? 1;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
      {STEPS.map((s, i) => {
        const estado = estados[i];
        const active = s.n === current;
        const completo = estado === "COMPLETADO";
        return (
          <div key={s.n} className="flex items-center gap-2">
            <Link
              href={`${basePath}/${s.slug}`}
              className={`relative flex items-center gap-2 overflow-hidden rounded-full px-3 py-1.5 text-[12.5px] font-bold ${
                active ? "" : completo ? "bg-success-soft text-success" : "bg-surface text-text-faint"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`step-pill-${basePath}`}
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                  active ? "bg-white/25 text-white" : completo ? "bg-success text-white" : "bg-white"
                }`}
              >
                {completo && !active ? <CheckIcon className="h-3 w-3" /> : s.n}
              </span>
              <span className={`relative z-10 hidden sm:inline ${active ? "text-white" : ""}`}>
                {s.label}
              </span>
            </Link>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-border sm:w-6" />}
          </div>
        );
      })}
    </div>
  );
}
