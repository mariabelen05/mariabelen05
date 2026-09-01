"use client";

import { motion } from "motion/react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AnimatedCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  className?: string;
};

/**
 * Checkbox nativo (para que siga funcionando en FormData / validación HTML)
 * visualmente oculto detrás de una caja animada que dibuja el tilde al
 * marcarse.
 */
export function AnimatedCheckbox({ checked, className, ...props }: AnimatedCheckboxProps) {
  return (
    <span className={cn("relative inline-flex h-4 w-4 shrink-0 items-center justify-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        className="absolute inset-0 h-4 w-4 cursor-pointer opacity-0"
        {...props}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[5px] border"
        animate={{
          backgroundColor: checked ? "var(--color-primary)" : "var(--color-surface)",
          borderColor: checked ? "var(--color-primary)" : "var(--color-border)",
        }}
        transition={{ duration: 0.15 }}
      />
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none relative h-3 w-3 text-white">
        <motion.path
          d="M3.5 8.5L6.5 11.5L12.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </svg>
    </span>
  );
}
