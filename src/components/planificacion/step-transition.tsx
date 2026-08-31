"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useRef, type ReactNode } from "react";

const ORDER = ["paso-1", "paso-2", "paso-3", "paso-4"];

/**
 * Envuelve el contenido de cada paso y lo desliza según la dirección de
 * navegación (avanzar vs. retroceder). Vive en el layout compartido de
 * /planificaciones/[id], que no se desmonta entre pasos — por eso el
 * ref de "paso anterior" persiste entre navegaciones reales de Next.
 */
export function StepTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    ORDER.findIndex((slug) => pathname.endsWith(`/${slug}`)),
  );
  const prevIndexRef = useRef(currentIndex);
  const direction = currentIndex >= prevIndexRef.current ? 1 : -1;
  prevIndexRef.current = currentIndex;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -24 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
