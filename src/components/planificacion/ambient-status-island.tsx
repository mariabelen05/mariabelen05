"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { DynamicIsland } from "@/components/ui/dynamic-island";
import { SparkleIcon, CheckIcon, AlertIcon } from "@/components/icons";
import type { SyncStatus } from "@/lib/offline/use-offline-draft";

type Tone = "neutral" | "warn" | "error" | "ia";

const SYNC_MESSAGE: Partial<Record<SyncStatus, { label: string; tone: Tone }>> = {
  sincronizando: { label: "Guardando…", tone: "neutral" },
  "guardado-local": { label: "Guardado en este dispositivo", tone: "warn" },
  "sin-conexion": { label: "Sin conexión — guardado localmente", tone: "warn" },
  error: { label: "No se pudo guardar", tone: "error" },
};

const DOT_CLASS: Record<Tone, string> = {
  neutral: "bg-white",
  warn: "bg-warning",
  error: "bg-danger",
  ia: "bg-purple",
};

/**
 * Indicador de estado ambiente (Cult UI Dynamic Island) — reemplaza el
 * SyncStatusBadge inline que vivía junto al título de cada paso. Aparece
 * flotando arriba, centrado, solo mientras hay algo que comunicar: se
 * expande con un mensaje corto y se retira solo, sin ocupar lugar en el
 * flujo del contenido ni tapar nada (top, no colisiona con el AssistantPanel
 * que vive abajo a la derecha).
 */
export function AmbientStatusIsland({
  status,
  iaGenerando,
}: {
  status: SyncStatus;
  iaGenerando?: boolean;
}) {
  const message = iaGenerando
    ? { label: "La IA está generando sugerencias", tone: "ia" as const }
    : SYNC_MESSAGE[status];

  const [show, setShow] = useState(false);
  const [flashOk, setFlashOk] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      setFlashOk(false);
      return;
    }
    if (status === "sincronizado") {
      setShow(true);
      setFlashOk(true);
      const t = setTimeout(() => setShow(false), 1800);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [message?.label, status]);

  const content = message ?? (flashOk ? { label: "Guardado", tone: "neutral" as const } : null);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center">
      <AnimatePresence>
        {show && content && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <DynamicIsland
              isExpanded
              className="pointer-events-auto px-4 py-2 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)]"
              compact={null}
              expanded={
                <span className="flex items-center gap-2 px-1 text-[12.5px] font-semibold">
                  {content.tone === "ia" ? (
                    <SparkleIcon className="h-3.5 w-3.5 text-purple" />
                  ) : content.label === "Guardado" ? (
                    <CheckIcon className="h-3.5 w-3.5 text-success" />
                  ) : content.tone === "error" ? (
                    <AlertIcon className="h-3.5 w-3.5 text-danger" />
                  ) : (
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[content.tone]} animate-pulse`} />
                  )}
                  {content.label}
                </span>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
