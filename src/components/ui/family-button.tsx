"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { MoreIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface FamilyButtonAction {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * Botón "..." que se abre en abanico mostrando acciones rápidas, en vez de
 * un menú desplegable tradicional. Cierra solo al hacer click afuera o al
 * ejecutar una acción.
 */
export function FamilyButton({ actions, className }: { actions: FamilyButtonAction[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative flex items-center", className)}>
      <AnimatePresence>
        {open &&
          actions.map((action, i) => (
            <motion.button
              key={action.key}
              type="button"
              title={action.label}
              aria-label={action.label}
              disabled={action.disabled}
              initial={{ opacity: 0, scale: 0.4, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.4, x: 10 }}
              transition={{ type: "spring", stiffness: 420, damping: 26, delay: i * 0.04 }}
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className={cn(
                "mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-text-faint",
                "hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40",
                action.danger && "hover:border-danger hover:text-danger",
              )}
            >
              {action.icon}
            </motion.button>
          ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Más acciones"
        aria-expanded={open}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-text-faint",
          "hover:border-primary hover:text-primary",
          open && "border-primary text-primary",
        )}
      >
        <MoreIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
