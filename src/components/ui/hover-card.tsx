"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tarjeta que aparece al pasar el mouse sobre el trigger (con un pequeño
 * delay para no dispararse en cada roce), pensada para previsualizar
 * contenido truncado sin necesitar un click.
 */
export function HoverCard({
  trigger,
  children,
  className,
  openDelay = 350,
  closeDelay = 100,
}: {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = (next: boolean) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(next), next ? openDelay : closeDelay);
  };

  return (
    <div
      className={cn("relative inline-block min-w-0", className)}
      onMouseEnter={() => schedule(true)}
      onMouseLeave={() => schedule(false)}
    >
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-0 top-[calc(100%+6px)] z-40 w-max max-w-[280px] rounded-xl border",
              "border-border bg-card px-3.5 py-2.5 text-xs text-text",
              "shadow-[0_20px_50px_-12px_rgba(30,35,64,0.35)]",
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
