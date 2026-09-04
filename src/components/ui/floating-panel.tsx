"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FloatingPanelContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const FloatingPanelContext = createContext<FloatingPanelContextValue | null>(null);

function usePanelContext() {
  const ctx = useContext(FloatingPanelContext);
  if (!ctx) {
    throw new Error("FloatingPanel.Trigger/Content must be used inside FloatingPanel.Root");
  }
  return ctx;
}

function Root({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };

  return <FloatingPanelContext.Provider value={{ open, setOpen }}>{children}</FloatingPanelContext.Provider>;
}

function Trigger({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = usePanelContext();
  return (
    <button type="button" onClick={() => setOpen(!open)} className={className} aria-expanded={open}>
      {children}
    </button>
  );
}

const SIDE_CLASSES = {
  "bottom-right": "bottom-6 right-6 lg:right-10",
  "bottom-left": "bottom-6 left-6 lg:left-10",
} as const;

function Content({
  title,
  children,
  className,
  side = "bottom-right",
}: {
  title: string;
  children: ReactNode;
  className?: string;
  side?: keyof typeof SIDE_CLASSES;
}) {
  const { open, setOpen } = usePanelContext();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className={cn(
            "fixed z-30 flex max-h-[70vh] w-[92vw] max-w-[360px] flex-col overflow-hidden rounded-2xl",
            "border border-border bg-card shadow-[0_20px_50px_-12px_rgba(30,35,64,0.35)]",
            SIDE_CLASSES[side],
            className,
          )}
        >
          <div className="flex items-center justify-between bg-purple-soft px-4 py-3">
            <span className="text-sm font-bold text-purple">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-purple/70 hover:text-purple"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const FloatingPanel = { Root, Trigger, Content };
