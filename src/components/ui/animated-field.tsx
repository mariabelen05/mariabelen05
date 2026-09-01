"use client";

import { motion } from "motion/react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface AnimatedFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/** Input con foco animado (leve escala + glow), sin cambiar validación ni comportamiento del form. */
export function AnimatedField({ label, hint, className, ...props }: AnimatedFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-text">{label}</span>
      <motion.input
        whileFocus={{ scale: 1.015, boxShadow: "0 0 0 4px var(--color-primary-soft)" }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary",
          className,
        )}
        {...props}
      />
      {hint && <span className="text-xs text-text-faint">{hint}</span>}
    </label>
  );
}
