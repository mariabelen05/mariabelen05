"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface PopoverFormContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverFormContext = createContext<PopoverFormContextValue | null>(null);

function usePopoverContext() {
  const ctx = useContext(PopoverFormContext);
  if (!ctx) {
    throw new Error("PopoverForm.Trigger/Content must be used inside PopoverForm.Root");
  }
  return ctx;
}

function Root({ children, className }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <PopoverFormContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className={cn("relative inline-block", className)}>
        {children}
      </div>
    </PopoverFormContext.Provider>
  );
}

function Trigger({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = usePopoverContext();
  return (
    <button type="button" onClick={() => setOpen(!open)} className={className} aria-expanded={open}>
      {children}
    </button>
  );
}

const ALIGN_CLASSES = {
  "bottom-start": "top-[calc(100%+8px)] left-0",
  "bottom-end": "top-[calc(100%+8px)] right-0",
} as const;

function Content({
  children,
  className,
  align = "bottom-end",
}: {
  children: ReactNode;
  className?: string;
  align?: keyof typeof ALIGN_CLASSES;
}) {
  const { open } = usePopoverContext();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute z-30 w-[min(92vw,340px)] overflow-hidden rounded-2xl border border-border bg-card",
            "shadow-[0_20px_50px_-12px_rgba(30,35,64,0.35)]",
            ALIGN_CLASSES[align],
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Cierra el popover — para usar en el submit del formulario que contiene. */
function useClosePopover() {
  const { setOpen } = usePopoverContext();
  return () => setOpen(false);
}

export const PopoverForm = { Root, Trigger, Content, useClosePopover };
