"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Marca de resaltado con efecto de marcador: el fondo entra con un barrido
 * de izquierda a derecha en vez de aparecer de golpe. Reemplaza el <mark>
 * estático que usaba renderHighlighted.
 */
export function Highlight({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <mark className="relative isolate inline whitespace-pre-wrap rounded-[3px] bg-transparent text-inherit">
      <motion.span
        aria-hidden
        className="absolute inset-0 -z-10 origin-left rounded-[3px] bg-highlight"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.32, ease: "easeOut", delay }}
      />
      {children}
    </mark>
  );
}
