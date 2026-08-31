"use client";

import { crearPlanificacion } from "@/lib/actions/planificacion-actions";
import { PopoverForm } from "@/components/ui/popover-form";
import { PlusIcon } from "@/components/icons";

/**
 * Alta rápida desde la tarjeta "+": pide solo título y materia (subtítulo) y
 * crea la planificación en modo independiente — el mismo crearPlanificacion
 * de siempre, sin los campos de institución/contexto/canvas de la pantalla
 * completa. Quien necesite Modo A (institución) o escribir el contexto sigue
 * usando "Nueva planificación" desde el paso 1 del editor.
 */
export function NuevaRapidaPopover({
  trigger,
  align = "bottom-end",
}: {
  trigger: React.ReactNode;
  align?: "bottom-start" | "bottom-end";
}) {
  return (
    <PopoverForm.Root>
      <PopoverForm.Trigger className="contents">{trigger}</PopoverForm.Trigger>
      <PopoverForm.Content align={align}>
        <form action={crearPlanificacion} className="flex flex-col gap-3 p-4">
          <input type="hidden" name="modo" value="independiente" />
          <div className="text-sm font-bold text-text">Nueva planificación</div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-text-faint">Título</span>
            <input
              name="titulo"
              required
              autoFocus
              placeholder="Matemática — Funciones — 3.º año"
              className="rounded-[10px] border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-text-faint">Subtítulo (materia)</span>
            <input
              name="materia"
              placeholder="Matemática"
              className="rounded-[10px] border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <p className="text-[11px] text-text-faint">
            El resto lo completás en el paso 1 — esto solo crea el borrador.
          </p>
          <button
            type="submit"
            className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Crear
          </button>
        </form>
      </PopoverForm.Content>
    </PopoverForm.Root>
  );
}
