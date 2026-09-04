"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DynamicIslandProps {
  isExpanded: boolean;
  compact: ReactNode;
  expanded: ReactNode;
  className?: string;
}

export function DynamicIsland({ isExpanded, compact, expanded, className }: DynamicIslandProps) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 32, mass: 1 }}
      className={cn(
        "mx-auto flex items-center justify-center overflow-hidden bg-neutral-950 text-white shadow-xl",
        isExpanded ? "rounded-[28px] px-6 py-4" : "rounded-full px-4 py-2.5",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={isExpanded ? "expanded" : "compact"}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.15 }}
        >
          {isExpanded ? expanded : compact}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
