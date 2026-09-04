"use client";

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { createContext, useContext, useRef, type ReactNode } from "react";

const DockContext = createContext<MotionValue<number | null> | null>(null);

/**
 * Dock estilo macOS adaptado a un sidebar vertical: los íconos se agrandan
 * según la cercanía del cursor en el eje Y, con un halo de influencia
 * limitado (no es un dock horizontal flotante, es el nav de siempre con el
 * efecto de magnificación agregado).
 */
export function Dock({ children, className }: { children: ReactNode; className?: string }) {
  const mouseY = useMotionValue<number | null>(null);

  return (
    <DockContext.Provider value={mouseY}>
      <div
        onMouseMove={(e) => mouseY.set(e.clientY)}
        onMouseLeave={() => mouseY.set(null)}
        className={className}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
}

export function DockIcon({ children, className }: { children: ReactNode; className?: string }) {
  const ctxMouseY = useContext(DockContext);
  const fallback = useMotionValue<number | null>(null);
  const mouseY = ctxMouseY ?? fallback;
  const ref = useRef<HTMLDivElement>(null);

  const scale = useTransform(mouseY, (val) => {
    const rect = ref.current?.getBoundingClientRect();
    if (val === null || !rect) return 1;
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(val - center);
    const range = 90;
    if (distance > range) return 1;
    return 1 + 0.4 * (1 - distance / range);
  });

  const springScale = useSpring(scale, { stiffness: 320, damping: 20, mass: 0.2 });

  return (
    <motion.div ref={ref} style={{ scale: springScale }} className={className}>
      {children}
    </motion.div>
  );
}
