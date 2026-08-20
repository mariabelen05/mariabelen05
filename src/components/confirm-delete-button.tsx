"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "@/components/icons";

export function ConfirmDeleteButton({
  onDelete,
  label = "Eliminar",
  confirmText = "¿Eliminar? No se puede deshacer.",
  className = "shrink-0 text-danger disabled:opacity-50",
}: {
  onDelete: () => void | Promise<void>;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirmando) {
    return (
      <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <span className="text-[11px] font-semibold text-danger">{confirmText}</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => onDelete())}
          className="rounded-lg bg-danger px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Sí"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmando(false)}
          className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-text disabled:opacity-60"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setConfirmando(true);
      }}
      className={className}
      aria-label={label}
      title={label}
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
