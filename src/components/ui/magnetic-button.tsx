"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, type ComponentPropsWithoutRef, type MouseEvent } from "react";

interface MagneticButtonProps extends ComponentPropsWithoutRef<typeof motion.button> {
  /** Qué tan fuerte "atrae" el botón hacia el cursor, 0–1. */
  strength?: number;
}

export function MagneticButton({ children, strength = 0.35, disabled, ...props }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
