"use client";

import { motion } from "motion/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CosmicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  glowClassName?: string;
}

export function CosmicButton({ children, className, glowClassName, ...props }: CosmicButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1.5px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      <motion.span
        aria-hidden
        className={cn("absolute inset-[-1000%]", glowClassName)}
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, #7c6ff0 0%, #ff8a5b 50%, #3b5fe0 75%, #7c6ff0 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-2 rounded-full",
          "bg-neutral-950 px-6 py-2.5 text-sm font-medium text-white",
          "transition-colors duration-200 group-hover:bg-neutral-900",
        )}
      >
        {children}
      </span>
    </button>
  );
}
